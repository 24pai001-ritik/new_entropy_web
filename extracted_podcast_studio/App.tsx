
import React, { useState, useEffect } from 'react';
import { AppState, PodcastSettings, OutlineData, Caption } from './types';
import { InputForm } from './components/InputForm';
import { ScriptDisplay } from './components/ScriptDisplay';
import { AudioPlayer } from './components/AudioPlayer';
import { OutlineDisplay } from './components/OutlineDisplay';
import { ScriptEditor } from './components/ScriptEditor';
import { generateScript, generateAudio, generateOutline, detectImpactfulWords, generateImpactImage } from './services/gemini';
import { decodeBase64, decodeAudioData, mixPodcastAudio, concatenateAudioBuffers, trimAudioBuffer } from './services/audioUtils';
import { Mic2, Sparkles, Clapperboard, FileText, CheckCircle2, Circle, Radio, Activity, Cast } from 'lucide-react';
import { DEFAULT_HOSTS } from './constants';

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [settings, setSettings] = useState<PodcastSettings>({
    topic: '',
    tone: 'Informative',
    duration: '5',
    language: 'English',
    scriptFormat: 'devanagari',
    targetAudience: 'General Public',
    aspectRatio: '16:9',
    hostCount: 2,
    hosts: DEFAULT_HOSTS.slice(0, 2),
    contentFormat: 'podcast',
    logo: null,
    visualizerCategories: ['core', 'ai']
  });

  const [outlineData, setOutlineData] = useState<OutlineData>({ title: '', content: '', sources: [] });
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [impactfulImages, setImpactfulImages] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    const init = async () => {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
    };
    init();
    return () => {
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, []);

  const handleGenerateOutline = async () => {
    setAppState(AppState.GENERATING_OUTLINE);
    setErrorMsg(null);
    try {
      const data = await generateOutline(settings);
      setOutlineData({ ...data, title: data.title || settings.topic });
      setAppState(AppState.OUTLINE_REVIEW);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to generate outline: " + err.message);
      setAppState(AppState.ERROR);
    }
  };

  const handleGenerateScript = async (confirmedTitle?: string) => {
    setAppState(AppState.GENERATING_SCRIPT);
    setErrorMsg(null);
    if (confirmedTitle) setSettings(prev => ({ ...prev, topic: confirmedTitle }));
    try {
      const script = await generateScript(outlineData.content, settings);
      setGeneratedScript(script);
      setAppState(AppState.SCRIPT_REVIEW);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to generate script: " + err.message);
      setAppState(AppState.ERROR);
    }
  };

  const handleRenderMedia = async (finalScript: string) => {
    setGeneratedScript(finalScript);
    setAppState(AppState.GENERATING_MEDIA);
    setErrorMsg(null);
    try {
      if (!audioContext) throw new Error("Audio Context not initialized");
      const audioSegments = await generateAudio(finalScript, settings);
      const processedSegments = await Promise.all(audioSegments.map(async (seg) => {
        const bytes = decodeBase64(seg.audioData);
        let buffer = await decodeAudioData(bytes, audioContext);
        buffer = trimAudioBuffer(audioContext, buffer);
        return { buffer, ...seg };
      }));
      const buffers = processedSegments.map(s => s.buffer);
      const stitchedSpeechBuffer = concatenateAudioBuffers(audioContext, buffers);
      const skipMusic = settings.contentFormat === 'reels';
      const introOffset = skipMusic ? 0 : 3.5;
      let currentTime = introOffset;
      const newCaptions: Caption[] = [];
      processedSegments.forEach(seg => {
        const duration = seg.buffer.duration;
        const cleanText = seg.text.replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim();
        if (cleanText) {
          newCaptions.push({ speaker: seg.speaker, text: cleanText, start: currentTime, end: currentTime + duration });
        }
        currentTime += duration;
      });
      setCaptions(newCaptions);
      const finalBuffer = await mixPodcastAudio(audioContext, stitchedSpeechBuffer, skipMusic);
      setAudioBuffer(finalBuffer);

      // --- REEL SPECIFIC: IMPACTFUL WORDS & IMAGES ---
      if (settings.contentFormat === 'reels') {
        try {
          const words = await detectImpactfulWords(finalScript);
          const images = await Promise.all(words.map(async (w) => {
            // Find the timestamp for this word in captions
            const caption = newCaptions.find(c => c.text.toLowerCase().includes(w.text.toLowerCase()));
            if (caption) {
              const url = await generateImpactImage(w.text, w.emotionalIntent);
              return { url, word: w.text, start: caption.start, end: caption.end };
            }
            return null;
          }));
          setImpactfulImages(images.filter(img => img !== null));
        } catch (e) {
          console.warn("Failed to generate impactful images for reel", e);
        }
      } else {
        setImpactfulImages([]);
      }

      setAppState(AppState.PLAYING);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to generate podcast media: " + err.message);
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setOutlineData({ title: '', content: '', sources: [] });
    setGeneratedScript('');
    setAudioBuffer(null);
    setCaptions([]);
    setErrorMsg(null);
  };

  // Step Indicator Logic
  const steps = [
    { id: 'setup', label: 'Setup', activeStates: [AppState.IDLE, AppState.GENERATING_OUTLINE] },
    { id: 'outline', label: 'Outline', activeStates: [AppState.OUTLINE_REVIEW, AppState.GENERATING_SCRIPT] },
    { id: 'script', label: 'Script', activeStates: [AppState.SCRIPT_REVIEW, AppState.GENERATING_MEDIA] },
    { id: 'play', label: 'Production', activeStates: [AppState.PLAYING] }
  ];

  const currentStepIdx = steps.findIndex(s => s.activeStates.includes(appState));

  return (
    <div className="min-h-screen text-slate-100 selection:bg-blue-500/30 relative overflow-hidden font-sans">

      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 bg-[#0f172a]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-blue-900/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
              <Mic2 className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Gemini Studio</h1>
            </div>
          </div>

          {/* Step Progress */}
          <div className="hidden md:flex items-center gap-2">
            {steps.map((step, idx) => {
              const isActive = idx === currentStepIdx;
              const isCompleted = idx < currentStepIdx;
              return (
                <div key={step.id} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isActive ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]' :
                    isCompleted ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                    {isCompleted ? <CheckCircle2 size={14} /> : isActive ? <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" /> : <Circle size={14} />}
                    {step.label}
                  </div>
                  {idx < steps.length - 1 && <div className="w-4 h-[1px] bg-slate-800" />}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">

        {errorMsg && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-center animate-fade-in backdrop-blur-md shadow-lg">
            <p className="font-medium flex items-center justify-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {errorMsg}</p>
            <button onClick={resetApp} className="mt-2 text-xs uppercase font-bold tracking-wider hover:text-white transition-colors">Dismiss & Try Again</button>
          </div>
        )}

        <div className="animate-fade-in-up">
          {appState === AppState.IDLE && (
            <InputForm
              settings={settings}
              setSettings={setSettings}
              onGenerate={handleGenerateOutline}
              isLoading={false}
            />
          )}

          {appState === AppState.OUTLINE_REVIEW && (
            <OutlineDisplay
              outline={outlineData.content}
              sources={outlineData.sources}
              initialTitle={outlineData.title || settings.topic}
              setOutline={(val) => setOutlineData(prev => ({ ...prev, content: val }))}
              onConfirm={handleGenerateScript}
              onCancel={() => setAppState(AppState.IDLE)}
              isProcessing={false}
            />
          )}

          {appState === AppState.SCRIPT_REVIEW && (
            <ScriptEditor
              initialScript={generatedScript}
              settings={settings}
              onConfirm={handleRenderMedia}
              onCancel={() => setAppState(AppState.OUTLINE_REVIEW)}
              isProcessing={false}
            />
          )}

          {(appState === AppState.GENERATING_OUTLINE || appState === AppState.GENERATING_SCRIPT || appState === AppState.GENERATING_MEDIA) && (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-8 glass-panel rounded-3xl p-12 max-w-2xl mx-auto shadow-2xl">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                <div className="w-24 h-24 rounded-full border-4 border-slate-700/50 border-t-blue-500 animate-spin relative z-10"></div>
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  {appState === AppState.GENERATING_OUTLINE && <Sparkles className="text-blue-400 animate-pulse" size={32} />}
                  {appState === AppState.GENERATING_SCRIPT && <FileText className="text-purple-400 animate-pulse" size={32} />}
                  {appState === AppState.GENERATING_MEDIA && <Clapperboard className="text-emerald-400 animate-pulse" size={32} />}
                </div>
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                  {appState === AppState.GENERATING_OUTLINE && "Researching Topic..."}
                  {appState === AppState.GENERATING_SCRIPT && "Writing Script..."}
                  {appState === AppState.GENERATING_MEDIA && "Producing Episode..."}
                </h3>
                <p className="text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {appState === AppState.GENERATING_OUTLINE && "Analyzing web sources, identifying key angles, and structuring the narrative."}
                  {appState === AppState.GENERATING_SCRIPT && "Crafting dialogue, adding personality, and optimizing for natural speech."}
                  {appState === AppState.GENERATING_MEDIA && "Synthesizing AI voices, mixing audio, and rendering visualization frames."}
                </p>
              </div>
            </div>
          )}

          {appState === AppState.PLAYING && audioBuffer && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Main Player Column */}
              <div className="xl:col-span-2 space-y-6">
                {/* Cinema Header */}
                <div className="relative overflow-hidden rounded-2xl glass-panel p-6 border border-white/5">
                  <div className="absolute -right-10 -top-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live Preview
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                          {new Date().toLocaleDateString()} • SEASON 1 EP 1
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight max-w-2xl">
                        {settings.topic}
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs font-medium text-slate-300">
                        <Radio size={14} className="text-purple-400" />
                        {settings.tone}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs font-medium text-slate-300">
                        <Cast size={14} className="text-blue-400" />
                        {settings.contentFormat === 'news' ? 'Broadcast' : settings.contentFormat.charAt(0).toUpperCase() + settings.contentFormat.slice(1)}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs font-medium text-slate-300">
                        <Activity size={14} className="text-emerald-400" />
                        {settings.duration}m
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visualizer Container with Glow */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[26px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                  <AudioPlayer
                    audioBuffer={audioBuffer}
                    onReset={resetApp}
                    aspectRatio={settings.aspectRatio}
                    topic={settings.topic}
                    script={generatedScript}
                    captions={captions}
                    logo={settings.logo}
                    contentFormat={settings.contentFormat}
                    impactfulImages={impactfulImages}
                  />
                </div>
              </div>

              {/* Script / Transcript Column */}
              <div className="h-[600px] xl:h-[calc(100vh-140px)] min-h-[500px] sticky top-24">
                <ScriptDisplay script={generatedScript} settings={settings} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
