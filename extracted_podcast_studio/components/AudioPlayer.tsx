
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Shuffle, AlignLeft, BarChart2, Circle, Activity, Zap, Grid, Aperture, Smile, Sun, Hexagon, CloudFog, Dna, Network, Disc, Mountain, Radio, Box, GitMerge, Flower, Code, Cuboid, Triangle, CloudDrizzle, Brain, ArrowRight, Settings2, MonitorPlay, Type, RefreshCw, PenTool, FileAudio, Video } from 'lucide-react';
import { Caption, VisualizerMode, CaptionStyle, Particle, ContentFormat } from '../types';
import { bufferToWave } from '../services/audioUtils';
import * as Visualizer from '../services/visualizerCanvas';
import { renderVideoToBlob } from '../services/videoRenderer';
import { getTopicVisualizerState } from '../services/topicVisualizerSystem';

interface AudioPlayerProps {
  audioBuffer: AudioBuffer;
  onReset: () => void;
  aspectRatio: string;
  topic: string;
  script: string;
  captions: Caption[];
  logo: string | null;
  firstImage: string | null;
  lastImage: string | null;
  brandColors: {
    primary: string;
    secondary: string;
    text: string;
    accent: string;
  };
  contentFormat: ContentFormat;
  impactfulImages?: any[];
}


export const extraVisualizers = ['dna', 'neuralNet', 'galaxy', 'landscape', 'ripple', 'hexGrid', 'newsRadar', 'string', 'flower', 'digitalRain'];
export const rlSketchVisualizers = ["drawRLGridworldVisualizer", "drawPolicyArrowsVisualizer", "drawNeuralNetworkGraphVisualizer", "drawQTableHeatmapVisualizer", "drawRobotOutlineVisualizer", "drawTigerStripesVisualizer", "drawStateTransitionGraphVisualizer"];

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBuffer, onReset, aspectRatio, topic, captions, logo, firstImage, lastImage, brandColors, contentFormat, impactfulImages }) => {

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('auto');
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('boxed');
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);

  // Sync Refs
  const captionsRef = useRef(captions);
  const topicRef = useRef(topic);
  const visualizerModeRef = useRef<VisualizerMode>('auto');
  const captionStyleRef = useRef<CaptionStyle>('boxed');
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const firstImgRef = useRef<HTMLImageElement | null>(null);
  const lastImgRef = useRef<HTMLImageElement | null>(null);
  const brandColorsRef = useRef(brandColors);

  const hueRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const impactfulImagesRef = useRef<any[]>([]);
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Audio Graph
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Update Refs
  useEffect(() => { captionsRef.current = captions; }, [captions]);
  useEffect(() => { topicRef.current = topic; }, [topic]);
  useEffect(() => { visualizerModeRef.current = visualizerMode; }, [visualizerMode]);
  useEffect(() => { captionStyleRef.current = captionStyle; }, [captionStyle]);
  useEffect(() => { brandColorsRef.current = brandColors; }, [brandColors]);


  useEffect(() => {
    if (impactfulImages) {
      impactfulImagesRef.current = impactfulImages;
      // Pre-load images
      impactfulImages.forEach(img => {
        if (!loadedImagesRef.current.has(img.url)) {
          const htmlImg = new Image();
          htmlImg.src = img.url;
          htmlImg.onload = () => loadedImagesRef.current.set(img.url, htmlImg);
        }
      });
    }
  }, [impactfulImages]);

  useEffect(() => {
    if (logo) {
      const img = new Image();
      img.src = logo;
      img.onload = () => { logoImgRef.current = img; };
    } else { logoImgRef.current = null; }
  }, [logo]);

  useEffect(() => {
    if (firstImage) {
      const img = new Image();
      img.src = firstImage;
      img.onload = () => { firstImgRef.current = img; };
    } else { firstImgRef.current = null; }
  }, [firstImage]);

  useEffect(() => {
    if (lastImage) {
      const img = new Image();
      img.src = lastImage;
      img.onload = () => { lastImgRef.current = img; };
    } else { lastImgRef.current = null; }
  }, [lastImage]);


  useEffect(() => {
    const audio = new Audio();
    const blob = bufferToWave(audioBuffer, audioBuffer.length);
    audio.src = URL.createObjectURL(blob);
    audio.crossOrigin = "anonymous";
    audioElRef.current = audio;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    try {
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
    } catch (e) { console.warn("Graph setup warning:", e); }

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    renderLoop();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioElRef.current) { audioElRef.current.pause(); }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') { audioContextRef.current.close(); }
    };
  }, [audioBuffer]);

  useEffect(() => { if (audioElRef.current) audioElRef.current.volume = volume; }, [volume]);
  useEffect(() => { if (audioElRef.current) audioElRef.current.playbackRate = playbackRate; }, [playbackRate]);

  const togglePlay = async () => {
    if (!audioElRef.current || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    if (isPlaying) audioElRef.current.pause();
    else await audioElRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const renderLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const time = audioElRef.current ? audioElRef.current.currentTime : 0;
    let vizMode = visualizerModeRef.current;
    let hueOffset = 0;

    if (vizMode === 'auto') {
      const topicState = getTopicVisualizerState(topicRef.current, time);
      vizMode = topicState.visualizer;
      hueOffset = topicState.hueShift;
    }

    hueRef.current = (hueRef.current + 0.5) % 360;
    const baseHue = (hueRef.current + hueOffset) % 360;
    const brand = brandColorsRef.current;

    // Adjust hue if brand primary color is available (conceptual mapping)
    // For now, we'll priority use brand colors in visualizers, but allow hue for dynamic effects.

    const w = canvas.width;
    const h = canvas.height;

    // Draw Background
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.85);
    bgGrad.addColorStop(0, brand.primary + '11'); // Subtle glow
    bgGrad.addColorStop(0.5, brand.secondary + '05');
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);


    if (analyserRef.current) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      if (vizMode === 'wave') {
        analyserRef.current.getByteTimeDomainData(dataArray);
        Visualizer.drawWaveVisualizer(ctx, dataArray, bufferLength, w, h, baseHue);
      } else {
        analyserRef.current.getByteFrequencyData(dataArray);
        switch (vizMode) {
          case 'circle': Visualizer.drawCircleVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'bars': Visualizer.drawBarsVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'particles': Visualizer.drawParticlesVisualizer(ctx, dataArray, bufferLength, w, h, baseHue, particlesRef.current); break;
          case 'matrix': Visualizer.drawMatrixVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'kaleidoscope': Visualizer.drawKaleidoscopeVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'face': Visualizer.drawFaceVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'orb': Visualizer.drawOrbVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'geometric': Visualizer.drawGeometricVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'plasma': Visualizer.drawPlasmaVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'dna': Visualizer.drawDNAVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'neuralNet': Visualizer.drawNeuralNetVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'galaxy': Visualizer.drawGalaxyVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'landscape': Visualizer.drawLandscapeVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'ripple': Visualizer.drawRippleVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'hexGrid': Visualizer.drawHexGridVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'newsRadar': Visualizer.drawNewsRadarVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'string': Visualizer.drawStringVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'flower': Visualizer.drawFlowerVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'digitalRain': Visualizer.drawDigitalRainVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'drawRLGridworldVisualizer': Visualizer.drawRLGridworldVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'drawPolicyArrowsVisualizer': Visualizer.drawPolicyArrowsVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'drawNeuralNetworkGraphVisualizer': Visualizer.drawNeuralNetworkGraphVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'drawQTableHeatmapVisualizer': Visualizer.drawQTableHeatmapVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'drawRobotOutlineVisualizer': Visualizer.drawRobotOutlineVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'drawTigerStripesVisualizer': Visualizer.drawTigerStripesVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'drawStateTransitionGraphVisualizer': Visualizer.drawStateTransitionGraphVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'drawTokenLatticeVisualizer': Visualizer.drawTokenLatticeVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'drawAttentionMatrixVisualizer': Visualizer.drawAttentionMatrixVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'drawAgentSwarmVisualizer': Visualizer.drawAgentSwarmVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'drawBouncingBlobsVisualizer': Visualizer.drawBouncingBlobsVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          case 'drawBrainNetworkVisualizer': Visualizer.drawBrainNetworkVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
          default: Visualizer.drawCircleVisualizer(ctx, dataArray, bufferLength, w, h, baseHue); break;
        }
      }
    }

    // Vignette
    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.95);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Captions & Logo
    const activeCaption = captionsRef.current.find(c => time >= c.start && time <= c.end);
    if (activeCaption) Visualizer.drawCaptions(ctx, activeCaption, time, w, h, captionStyleRef.current, baseHue, brand);
    else Visualizer.drawTitleCard(ctx, topicRef.current, w, h, baseHue, brand);

    // Draw First (Hook) Image - First 4 seconds
    if (time < 4 && firstImgRef.current) {
      Visualizer.drawImpactfulImage(ctx, firstImgRef.current, time, 0, 4, w, h);
    }

    // Draw Last (Closure) Image - Last 5 seconds
    const duration = audioBuffer.duration;
    if (time > duration - 5 && lastImgRef.current) {
      Visualizer.drawImpactfulImage(ctx, lastImgRef.current, time, duration - 5, duration, w, h);
    }


    // Draw Impactful Images (Reels/Shorts)
    const activeImpactImg = impactfulImagesRef.current.find(img => time >= img.start && time <= img.end);
    if (activeImpactImg && loadedImagesRef.current.has(activeImpactImg.url)) {
      Visualizer.drawImpactfulImage(ctx, loadedImagesRef.current.get(activeImpactImg.url)!, time, activeImpactImg.start, activeImpactImg.end, w, h);
    }

    if (logoImgRef.current) Visualizer.drawLogo(ctx, logoImgRef.current, w, h);

    // Progress Bar
    const progress = time / audioBuffer.duration;
    ctx.fillStyle = `hsl(${(baseHue + 180) % 360}, 100%, 60%)`;
    ctx.fillRect(0, h - 8, w * progress, 8);

    animationFrameRef.current = requestAnimationFrame(renderLoop);
  };

  const handleDownloadVideo = async () => {
    if (isRendering) return;
    if (isPlaying) togglePlay();
    setIsRendering(true);
    setRenderProgress(0);
    try {
      const blob = await renderVideoToBlob({
        audioBuffer, captions, topic, visualizerMode, captionStyle, aspectRatio, logo,
        firstImage, lastImage, brandColors, impactfulImages,
        onProgress: (p) => setRenderProgress(p)
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `podcast_${topic.replace(/\s+/g, '_').slice(0, 20)}.mp4`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) { alert("Export failed."); }
    finally { setIsRendering(false); setRenderProgress(0); }
  };

  const handleDownloadAudio = () => {
    const blob = bufferToWave(audioBuffer, audioBuffer.length);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `podcast_audio_${topic.replace(/\s+/g, '_').slice(0, 20)}.wav`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const getAspectRatioStyle = () => {
    const [w, h] = aspectRatio.split(':').map(Number);
    return { aspectRatio: `${w}/${h}` };
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#000] rounded-[24px] border border-slate-700/50 shadow-2xl overflow-hidden relative group ring-1 ring-white/5 flex flex-col">

      {/* Canvas Area - Maintains Aspect Ratio */}
      <div
        className="w-full bg-black relative mx-auto flex items-center justify-center bg-[url('https://assets.codepen.io/123/bg-noise.png')]"
        style={{ width: '100%', ...getAspectRatioStyle() }}
      >
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="w-full h-full object-contain"
        />

        {/* Render Overlay */}
        {isRendering && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white font-semibold">Rendering Video...</p>
              <p className="text-slate-400 text-sm mt-1">{Math.round(renderProgress * 100)}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Control Deck - Placed Below Video */}
      <div className="w-full bg-[#0f172a] border-t border-white/10 p-4 md:p-6 z-20 relative">
        <div className="max-w-4xl mx-auto space-y-4">

          {/* Top Row: Scrubber */}
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-xs font-mono text-slate-400 w-10 md:w-12 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative h-6 flex items-center group/scrubber">
              {/* Scrubber Track Background */}
              <div className="absolute inset-x-0 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500/30 w-full origin-left transition-transform duration-100 ease-linear"
                  style={{ transform: `scaleX(${currentTime / (audioBuffer?.duration || 1)})` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max={audioBuffer?.duration || 0}
                value={currentTime}
                onChange={(e) => {
                  const t = parseFloat(e.target.value);
                  if (audioElRef.current) audioElRef.current.currentTime = t;
                  setCurrentTime(t);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {/* Custom Thumb (Visual only) */}
              <div
                className="w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] pointer-events-none absolute top-1/2 -translate-y-1/2 -ml-2 transition-all group-hover/scrubber:scale-125"
                style={{ left: `${(currentTime / (audioBuffer?.duration || 1)) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-slate-400 w-10 md:w-12">
              {formatTime(audioBuffer?.duration || 0)}
            </span>
          </div>

          {/* Bottom Row: Controls */}
          <div className="flex items-center justify-between gap-2 md:gap-4">

            {/* Left: Visualizer Tools */}
            <div className="flex gap-1.5 md:gap-2">
              <button
                onClick={() => setShowControls(!showControls)}
                className={`p-2 md:p-2.5 rounded-xl transition-all ${showControls
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                  : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 border border-transparent'
                  }`}
                title="Visual Settings"
              >
                <Settings2 size={18} />
              </button>
              <button
                onClick={() => setVisualizerMode('auto')}
                className={`p-2 md:p-2.5 rounded-xl transition-all ${visualizerMode === 'auto'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                  : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 border border-transparent'
                  }`}
                title="Auto Visualizer Mode"
              >
                <Shuffle size={18} />
              </button>
            </div>

            {/* Center: Main Playback */}
            <div className="flex items-center gap-3 md:gap-6">
              <button
                onClick={() => {
                  const newRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
                  setPlaybackRate(newRate);
                  if (audioElRef.current) audioElRef.current.playbackRate = newRate;
                }}
                className="text-xs font-bold text-slate-500 w-8 text-center hover:text-white transition-colors"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white text-slate-900 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                {isPlaying ? (
                  <Pause fill="currentColor" size={18} className="md:w-5 md:h-5" />
                ) : (
                  <Play fill="currentColor" size={18} className="ml-0.5 md:w-5 md:h-5" />
                )}
              </button>

              <div className="hidden sm:flex items-center gap-2 group relative w-20 md:w-24">
                <button
                  onClick={() => {
                    const newVol = volume === 0 ? 1 : 0;
                    setVolume(newVol);
                    if (audioElRef.current) audioElRef.current.volume = newVol;
                  }}
                >
                  {volume === 0 ? (
                    <VolumeX size={18} className="text-slate-500" />
                  ) : (
                    <Volume2 size={18} className="text-slate-400" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => {
                    const newVol = parseFloat(e.target.value);
                    setVolume(newVol);
                    if (audioElRef.current) audioElRef.current.volume = newVol;
                  }}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>
            </div>

            {/* Right: Export Actions */}
            <div className="flex gap-1.5 md:gap-2">
              <button
                onClick={handleDownloadVideo}
                disabled={isRendering}
                className="p-2 md:p-2.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl text-blue-400 transition-colors border border-blue-500/20 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export Video"
              >
                <Video size={18} />
                <span className="text-xs font-bold hidden lg:inline">MP4</span>
              </button>
              <button
                onClick={handleDownloadAudio}
                className="p-2 md:p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl text-emerald-400 transition-colors border border-emerald-500/20 flex items-center gap-1.5"
                title="Export Audio"
              >
                <FileAudio size={18} />
                <span className="text-xs font-bold hidden lg:inline">WAV</span>
              </button>
              <div className="hidden md:block w-[1px] h-8 bg-white/10 mx-1"></div>
              <button
                onClick={onReset}
                className="p-2 md:p-2.5 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 transition-colors"
                title="Start Over"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          {/* Expanded Visualizer Settings */}
          {showControls && (
            <div className="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                  <MonitorPlay size={12} /> Visual Style
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-1">
                  {['circle', 'bars', 'wave', 'particles', 'matrix', 'kaleidoscope', 'face', 'orb', 'geometric', 'plasma', ...(extraVisualizers || [])].map(m => (
                    <button
                      key={m}
                      onClick={() => setVisualizerMode(m as VisualizerMode)}
                      className={`px-2.5 py-1.5 text-[10px] font-medium rounded-lg border transition-all ${visualizerMode === m
                        ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/25'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Type size={12} /> Caption Style
                </label>
                <div className="flex gap-2">
                  {['boxed', 'karaoke', 'minimal'].map(s => (
                    <button
                      key={s}
                      onClick={() => setCaptionStyle(s as CaptionStyle)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${captionStyle === s
                        ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/25'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
