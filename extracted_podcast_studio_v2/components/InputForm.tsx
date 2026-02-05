
import React, { useState, useEffect, useRef } from 'react';
import { PodcastSettings, ContentFormat, HostConfig, YoutubeAnalysisMode } from '../types';
import { TONES, LANGUAGES, ASPECT_RATIOS, VOICE_OPTIONS, CONTENT_FORMATS, DEFAULT_HOSTS, TARGET_AUDIENCES, SCRIPT_FORMATS } from '../constants';
import { FileText, Wand2, Link, Youtube, Layers, Sparkles, Monitor, Users, PlayCircle, Loader2, Clock, Mic, Tv, Smartphone, BookOpen, Plus, Minus, Image as ImageIcon, Upload, ChevronDown, ChevronUp, Radio, Search, MessageCircle, Scale, GraduationCap, Zap } from 'lucide-react';
import { previewVoice } from '../services/gemini';
import { decodeBase64, decodeAudioData } from '../services/audioUtils';
import { VisualizerSelector } from './VisualizerSelector';

interface InputFormProps {
  settings: PodcastSettings;
  setSettings: React.Dispatch<React.SetStateAction<PodcastSettings>>;
  onGenerate: () => void;
  isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ settings, setSettings, onGenerate, isLoading }) => {
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const [isYoutubeDetected, setIsYoutubeDetected] = useState(false);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);

  // Persistent Audio Context for Previews
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Pre-fetch/Warm up cache for current hosts' voices
  useEffect(() => {
    const uniqueVoices = new Set(settings.hosts.map(h => h.voiceId));
    uniqueVoices.forEach(vid => {
        // Fire and forget - the service handles caching promises
        previewVoice(vid, settings.language, settings.scriptFormat).catch(() => {});
    });
  }, [settings.hosts, settings.language, settings.scriptFormat]);

  // Detect YouTube URL
  useEffect(() => {
    const urlPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = settings.topic.match(urlPattern);
    if (match && match[1]) {
        setIsYoutubeDetected(true);
        setYoutubeId(match[1]);
        if (!settings.youtubeAnalysisMode) {
            handleChange('youtubeAnalysisMode', 'deep_dive');
        }
    } else {
        setIsYoutubeDetected(false);
        setYoutubeId(null);
    }
  }, [settings.topic]);

  const handleChange = (field: keyof PodcastSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateHost = (index: number, field: keyof HostConfig, value: string) => {
      const newHosts = [...settings.hosts];
      newHosts[index] = { ...newHosts[index], [field]: value };
      setSettings(prev => ({ ...prev, hosts: newHosts }));
  };

  const handlePreview = async (voiceId: string) => {
      if (playingPreview) return;
      setPlayingPreview(voiceId);
      try {
          const base64 = await previewVoice(voiceId, settings.language, settings.scriptFormat);
          if (base64) {
            // Lazy init audio context
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') await ctx.resume();

            const bytes = decodeBase64(base64);
            const buffer = await decodeAudioData(bytes, ctx);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            // Do not close context here, reuse it
            source.onended = () => { setPlayingPreview(null); };
            source.start();
          } else { setPlayingPreview(null); }
      } catch (e) { console.error("Preview failed", e); setPlayingPreview(null); }
  };

  const changeHostCount = (delta: number) => {
      const newCount = Math.max(1, Math.min(4, settings.hostCount + delta));
      if (newCount === settings.hostCount) return;
      let newHosts = [...settings.hosts];
      if (newCount > settings.hosts.length) {
          const template = DEFAULT_HOSTS[newHosts.length] || DEFAULT_HOSTS[0];
          newHosts.push({ ...template });
      } else { newHosts = newHosts.slice(0, newCount); }
      setSettings(prev => ({ ...prev, hostCount: newCount, hosts: newHosts }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => { handleChange('logo', reader.result as string); };
        reader.readAsDataURL(file);
    }
  };

  const getFormatIcon = (id: string) => {
    switch(id) {
        case 'news': return <Tv size={20} />;
        case 'reels': return <Smartphone size={20} />;
        case 'research': return <BookOpen size={20} />;
        default: return <Mic size={20} />;
    }
  };

  // Grouped Voices
  const femaleVoices = VOICE_OPTIONS.filter(v => v.gender === 'Female');
  const maleVoices = VOICE_OPTIONS.filter(v => v.gender === 'Male');

  const analysisModes: {id: YoutubeAnalysisMode, label: string, icon: any, desc: string}[] = [
      { id: 'deep_dive', label: 'Deep Dive', icon: Search, desc: 'Analyze arguments & hidden details' },
      { id: 'debate', label: 'Debate', icon: Scale, desc: 'Find flaws & counter-arguments' },
      { id: 'reaction', label: 'Reaction', icon: MessageCircle, desc: 'Hosts react to the video content' },
      { id: 'educational', label: 'Explain', icon: GraduationCap, desc: 'Break it down for students' },
      { id: 'summary', label: 'Summary', icon: Zap, desc: 'Just the key facts, fast' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-8 pb-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.3)] backdrop-blur-sm">
          <Sparkles size={10} /> AI Powered Production
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
          Turn Ideas into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Broadcasts</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Create professional podcasts, news segments, and viral reels in seconds. 
          Just provide a topic or YouTube link, and let Gemini handle the rest.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Content Strategy */}
        <div className="lg:col-span-8 space-y-6">
            
            {/* 1. INPUT CARD */}
            <div className={`glass-panel rounded-3xl p-8 relative overflow-hidden group transition-all ${isYoutubeDetected ? 'border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : ''}`}>
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 transition-all ${isYoutubeDetected ? 'bg-red-600/10' : 'bg-blue-500/5 group-hover:bg-blue-500/10'}`}></div>
                
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isYoutubeDetected ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                             {isYoutubeDetected ? <Youtube size={20} /> : <Layers size={20} />}
                        </div>
                        {isYoutubeDetected ? 'YouTube Intelligence' : 'Content Source'}
                    </h2>
                    <div className="flex gap-2">
                        {isYoutubeDetected && (
                             <span className="animate-pulse px-2 py-1 bg-red-500/20 rounded border border-red-500/30 text-[10px] font-bold text-red-300 flex items-center gap-1">
                                LIVE LINK
                             </span>
                        )}
                        <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700 text-[10px] font-mono text-slate-400 flex items-center gap-1"><Youtube size={10} /> YouTube</span>
                        <span className="px-2 py-1 bg-slate-800/50 rounded border border-slate-700 text-[10px] font-mono text-slate-400 flex items-center gap-1"><Link size={10} /> Articles</span>
                    </div>
                </div>

                <div className="relative space-y-4">
                    <textarea
                        className={`w-full h-32 bg-[#0B0D14] border rounded-2xl p-6 text-lg text-slate-200 placeholder-slate-600 focus:ring-1 transition-all resize-none shadow-inner ${
                            isYoutubeDetected 
                            ? 'border-red-900/50 focus:border-red-500 focus:ring-red-500' 
                            : 'border-slate-800 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        placeholder="Paste a YouTube URL or describe your topic..."
                        value={settings.topic}
                        onChange={(e) => handleChange('topic', e.target.value)}
                    />

                    {/* YouTube Specific Controls */}
                    {isYoutubeDetected && (
                        <div className="animate-fade-in-up bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                                {youtubeId && <img src={`https://img.youtube.com/vi/${youtubeId}/default.jpg`} className="w-12 h-9 object-cover rounded border border-red-500/20" />}
                                <div>
                                    <h4 className="text-sm font-bold text-red-200">Video Detected</h4>
                                    <p className="text-[10px] text-red-300/60">AI will watch and analyze this video.</p>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Analysis Angle</label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    {analysisModes.map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => handleChange('youtubeAnalysisMode', mode.id)}
                                            className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                                                settings.youtubeAnalysisMode === mode.id
                                                ? 'bg-red-500/20 border-red-500 text-red-100 shadow-sm'
                                                : 'bg-slate-900/50 border-slate-700/50 text-slate-500 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300'
                                            }`}
                                        >
                                            <mode.icon size={14} className="mb-1" />
                                            <span className="text-[9px] font-bold">{mode.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. FORMAT & HOSTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Format Selection */}
                <div className="glass-panel rounded-3xl p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Monitor size={14} /> Format
                    </h3>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                        {CONTENT_FORMATS.map((fmt) => (
                            <button
                                key={fmt.id}
                                onClick={() => handleChange('contentFormat', fmt.id as ContentFormat)}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center ${
                                    settings.contentFormat === fmt.id
                                    ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.15)]'
                                    : 'bg-[#0B0D14]/50 border-slate-800 text-slate-500 hover:border-slate-700 hover:bg-[#0B0D14]'
                                }`}
                            >
                                <div className={`mb-2 p-2 rounded-lg ${settings.contentFormat === fmt.id ? 'bg-blue-500 text-white' : 'bg-slate-800/50'}`}>
                                    {getFormatIcon(fmt.id)}
                                </div>
                                <span className="font-bold text-xs">{fmt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Host Team */}
                <div className="glass-panel rounded-3xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Users size={14} /> Hosts
                        </h3>
                        <div className="flex items-center gap-2 bg-[#0B0D14] rounded-lg p-1 border border-slate-800">
                             <button onClick={() => changeHostCount(-1)} disabled={settings.hostCount <= 1} className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30"><Minus size={12} /></button>
                             <span className="text-xs font-bold w-4 text-center">{settings.hostCount}</span>
                             <button onClick={() => changeHostCount(1)} disabled={settings.hostCount >= 4} className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-30"><Plus size={12} /></button>
                        </div>
                    </div>

                    {/* LANGUAGE SELECTION */}
                    <div className="mb-4 space-y-2 p-3 bg-slate-900/40 rounded-xl border border-slate-800/50">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Language</label>
                                <select
                                    className="w-full bg-[#0B0D14] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:border-blue-500 outline-none appearance-none"
                                    value={settings.language}
                                    onChange={(e) => handleChange('language', e.target.value)}
                                >
                                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            
                            {(settings.language === 'Hindi' || settings.language === 'Hinglish') && (
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Script</label>
                                    <select
                                        className="w-full bg-[#0B0D14] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:border-blue-500 outline-none appearance-none"
                                        value={settings.scriptFormat}
                                        onChange={(e) => handleChange('scriptFormat', e.target.value)}
                                    >
                                        {SCRIPT_FORMATS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar flex-1">
                        {settings.hosts.map((host, idx) => (
                            <div key={host.id} className="p-3 bg-[#0B0D14]/50 border border-slate-800 rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                    <input 
                                        value={host.name}
                                        onChange={(e) => updateHost(idx, 'name', e.target.value)}
                                        className="bg-transparent text-sm font-bold text-slate-200 border-none outline-none placeholder-slate-600 w-24"
                                        placeholder="Name"
                                    />
                                    <span className="text-[9px] uppercase font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                        {idx === 0 ? 'Lead' : 'Co-Host'}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <select
                                            value={host.voiceId}
                                            onChange={(e) => updateHost(idx, 'voiceId', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none appearance-none"
                                        >
                                            <optgroup label="Female">{femaleVoices.map(v => <option key={v.id} value={v.id}>{v.label} ({v.accent})</option>)}</optgroup>
                                            <optgroup label="Male">{maleVoices.map(v => <option key={v.id} value={v.id}>{v.label} ({v.accent})</option>)}</optgroup>
                                        </select>
                                    </div>
                                    <button 
                                        onClick={() => handlePreview(host.voiceId)}
                                        disabled={!!playingPreview}
                                        className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                    >
                                        {playingPreview === host.voiceId ? <Loader2 size={12} className="animate-spin" /> : <PlayCircle size={12} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. VISUALIZERS */}
            <div className="glass-panel rounded-3xl p-8">
                 <VisualizerSelector 
                    selectedCategories={settings.visualizerCategories}
                    onChange={(cats) => handleChange('visualizerCategories', cats)}
                 />
            </div>
        </div>

        {/* RIGHT COLUMN: Settings & Launch */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* SETTINGS CARD */}
            <div className="glass-panel rounded-3xl p-6 space-y-6 sticky top-24">
                
                <h2 className="text-lg font-bold flex items-center gap-2 mb-2">
                    <Radio size={18} className="text-purple-400" /> Production Settings
                </h2>

                {/* Tone */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tone</label>
                    <select
                        className="w-full bg-[#0B0D14] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-purple-500 outline-none appearance-none"
                        value={settings.tone}
                        onChange={(e) => handleChange('tone', e.target.value)}
                    >
                        {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                        <span>Duration</span>
                        <span className="text-slate-300">{settings.duration} mins</span>
                     </label>
                     <input 
                        type="range"
                        min="1"
                        max="30"
                        value={settings.duration}
                        onChange={(e) => handleChange('duration', e.target.value)}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                     />
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Video Size</label>
                     <div className="flex bg-[#0B0D14] rounded-xl p-1 border border-slate-800">
                         {ASPECT_RATIOS.slice(0, 3).map(r => (
                             <button
                                key={r}
                                onClick={() => handleChange('aspectRatio', r)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                    settings.aspectRatio === r ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                                }`}
                             >
                                 {r}
                             </button>
                         ))}
                     </div>
                </div>

                {/* Logo */}
                <div className="pt-2">
                    <div className="relative group cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                        <label htmlFor="logo-upload" className="flex items-center justify-center gap-2 w-full bg-[#0B0D14] border border-slate-800 border-dashed rounded-xl px-4 py-3 text-slate-500 hover:text-white hover:border-purple-500 transition-all">
                            {settings.logo ? (
                                <div className="flex items-center gap-2 w-full justify-between">
                                    <div className="flex items-center gap-2">
                                        <img src={settings.logo} className="w-6 h-6 rounded object-cover" />
                                        <span className="text-xs font-bold text-purple-400">Logo Set</span>
                                    </div>
                                    <button onClick={(e) => {e.preventDefault(); handleChange('logo', null)}} className="text-slate-500 hover:text-red-400">×</button>
                                </div>
                            ) : (
                                <>
                                    <Upload size={14} /> <span className="text-xs font-bold">Upload Brand Logo</span>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                {/* GENERATE BUTTON */}
                <div className="pt-4">
                    <button
                        onClick={onGenerate}
                        disabled={isLoading || !settings.topic.trim()}
                        className={`
                            w-full py-5 rounded-2xl font-bold text-lg text-white shadow-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98]
                            ${isLoading || !settings.topic.trim()
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : isYoutubeDetected
                                    ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:shadow-red-500/25 border border-white/10'
                                    : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:shadow-purple-500/25 border border-white/10'
                            }
                        `}
                    >
                        {isLoading ? (
                            <><Loader2 className="animate-spin" /> Processing...</>
                        ) : isYoutubeDetected ? (
                             <><Youtube className="text-white" /> Analyze Video</>
                        ) : (
                            <><Wand2 className="text-white" /> Generate Episode</>
                        )}
                    </button>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};
