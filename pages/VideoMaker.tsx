
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Rocket, Zap, Play, Download, Sparkles, Activity, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as VideoService from '../services/videoService';
import { ImpactfulImage, ImpactfulWord } from '../types';

const VideoMaker: React.FC = () => {
    console.log("VideoMaker Rendered");
    const [topic, setTopic] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [isPlaying, setIsPlaying] = useState(false); // Playback state
    const [lastExportUrl, setLastExportUrl] = useState<string | null>(null);

    const [script, setScript] = useState<any[]>([]);
    const [captions, setCaptions] = useState<any[]>([]);
    const [impactImages, setImpactImages] = useState<ImpactfulImage[]>([]);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const startTimeRef = useRef<number>(0);
    const loadedBitmapsRef = useRef<Map<string, HTMLImageElement>>(new Map());

    // Helper to get dimenions
    const getDimensions = () => {
        switch (aspectRatio) {
            case '16:9': return { width: 1920, height: 1080, orientation: 'horizontal' as const };
            case '1:1': return { width: 1080, height: 1080, orientation: 'square' as const };
            default: return { width: 1080, height: 1920, orientation: 'vertical' as const };
        }
    };

    const handleGenerate = async () => {
        if (!topic) return;
        setIsGenerating(true);
        setStatus('Synthesizing Script...');
        console.log("Starting generation for topic:", topic);

        try {
            // Comprehensive Key Detection
            const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY ||
                (process as any).env?.GEMINI_API_KEY ||
                (process as any).env?.API_KEY;

            if (!apiKey) {
                console.warn("API Key Probe Failed. Env details:", {
                    "import.meta.env": !!(import.meta as any).env,
                    "process.env": !!(process as any).env
                });
                throw new Error("Gemini API Key missing. Please check your .env file for VITE_GEMINI_API_KEY or GEMINI_API_KEY.");
            } else {
                console.log("API Key Detected (first 6 chars):", apiKey.substring(0, 6) + "...");
            }

            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current = audioCtx;

            // 1. Script
            console.log("Generating Script...");
            const scriptData = await VideoService.generateVideoScript(topic, 'Energetic').catch(err => {
                console.error("Script Generation Failed:", err);
                throw new Error("Failed to generate script: " + err.message);
            });
            setScript(scriptData);
            console.log("Script Data received:", scriptData);

            // 2. Impactful Words
            setStatus('Identifying Impactful Moments...');
            console.log("Detecting impactful words...");
            const fullText = scriptData.map((s: any) => s.text).join(' ');
            const impactfulWords = await VideoService.detectImpactfulWords(fullText).catch(err => {
                console.error("Impactful Words Detection Failed:", err);
                throw new Error("Failed to detect impactful words: " + err.message);
            });
            console.log("Impactful words received:", impactfulWords);

            // 3. Audio & Captions
            // 3. Audio & Captions Generation
            setStatus('Synchronizing Voice & Visuals...');
            console.log("Generating audio...");

            const newImpactImages: ImpactfulImage[] = [];
            const newCaptions: any[] = [];
            const audioBuffers: AudioBuffer[] = [];
            let currentTime = 0;

            for (const seg of scriptData) {
                // Generate Speech
                const speechBuffer = await VideoService.generateSpeech(seg.text);
                const decodedAudio = await VideoService.decodeAudioData(new Uint8Array(speechBuffer), audioCtx);
                audioBuffers.push(decodedAudio);

                const duration = decodedAudio.duration; // Precise audio duration
                newCaptions.push({ text: seg.text, start: currentTime, end: currentTime + duration });

                const impact = impactfulWords.find((w: any) => seg.text.toLowerCase().includes(w.text.toLowerCase()));
                if (impact) {
                    const { orientation } = getDimensions();
                    const context = {
                        fullScript: fullText,
                        allKeywords: impactfulWords.map((w: any) => w.text)
                    };
                    const url = await VideoService.fetchImpactImage(impact.text, impact.emotionalIntent || '', orientation, context);
                    newImpactImages.push({ url, word: impact.text, start: currentTime, end: currentTime + duration });

                    // Pre-load for canvas
                    const img = new Image();
                    img.src = url;
                    img.onload = () => loadedBitmapsRef.current.set(url, img);
                }
                currentTime += duration;
            }

            setCaptions(newCaptions);
            setImpactImages(newImpactImages);

            // 4. Master Audio Track
            setStatus('Mastering Audio...');
            const masterBuffer = VideoService.concatenateAudioBuffers(audioCtx, audioBuffers);
            setAudioBuffer(masterBuffer);

            setStatus('Ready');
            console.log("Generation complete! Total Duration:", masterBuffer.duration);
        } catch (error: any) {
            console.error("Generation Error Details:", error);
            setStatus(`Error: ${error.message || 'Unknown error'}`);
            window.alert(`Generation Error: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExport = async () => {
        if (!audioBuffer) return;
        setIsExporting(true);
        try {
            const { width, height } = getDimensions();
            const blob = await VideoService.renderVideoToBlob(audioBuffer, captions, impactImages, (p) => setProgress(p), width, height);
            console.log(`[Export] Blob Size: ${blob.size}, Type: ${blob.type}`);

            if (blob.size < 1000) {
                window.alert("Warning: Generated video file is unusually small (" + blob.size + " bytes). Export may have failed.");
            }

            const url = URL.createObjectURL(blob);
            setLastExportUrl(url);
            console.log(`[Export] Generated Blob URL: ${url}`);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `reel-${Date.now()}.mp4`;
            document.body.appendChild(a);

            a.click();

            // cleanup after a small delay to ensure event fires
            setTimeout(() => {
                document.body.removeChild(a);
                // window.URL.revokeObjectURL(url);
                console.log("[Export] Auto-download triggered.");
            }, 100);
        } catch (e: any) {
            console.error(e);
            window.alert(`Export Failed: ${e.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    // Preview Loop

    // Playback Logic
    const togglePlayback = () => {
        if (!audioBuffer || !audioCtxRef.current) return;

        if (isPlaying) {
            // Stop
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
                audioSourceRef.current = null;
            }
            setIsPlaying(false);
        } else {
            // Start
            if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();

            const source = audioCtxRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtxRef.current.destination);
            source.start(0);

            source.onended = () => setIsPlaying(false);
            audioSourceRef.current = source;
            startTimeRef.current = audioCtxRef.current.currentTime;
            setIsPlaying(true);
        }
    };

    // Preview Loop (Synced to Audio)
    useEffect(() => {
        if (!canvasRef.current || captions.length === 0) return;
        const ctx = canvasRef.current.getContext('2d')!;
        let animFrame: number;

        const loop = () => {
            let time = 0;
            if (isPlaying && audioCtxRef.current) {
                time = audioCtxRef.current.currentTime - startTimeRef.current;
            }

            // Clamp time
            if (time < 0) time = 0;
            const duration = audioBuffer?.duration || 10;
            if (time > duration) time = duration;

            const hue = (time * 20) % 360;

            VideoService.Visualizer.drawBackground(ctx, canvasRef.current!.width, canvasRef.current!.height, hue);

            const activeImg = impactImages.find(img => time >= img.start && time <= img.end);
            if (activeImg && loadedBitmapsRef.current.has(activeImg.url)) {
                VideoService.Visualizer.drawImpactfulImage(ctx, loadedBitmapsRef.current.get(activeImg.url)!, time, activeImg.start, activeImg.end, canvasRef.current!.width, canvasRef.current!.height);
            }

            const activeCap = captions.find(c => time >= c.start && time <= c.end);
            if (activeCap) {
                VideoService.Visualizer.drawCaptions(ctx, activeCap.text, canvasRef.current!.width, canvasRef.current!.height, hue);
            }

            if (isPlaying) {
                animFrame = requestAnimationFrame(loop);
            }
        };

        // Draw initial frame if stopped
        if (!isPlaying) {
            loop();
        } else {
            loop(); // Start loop
        }

        return () => cancelAnimationFrame(animFrame);
    }, [captions, impactImages, isPlaying]);

    return (
        <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
            <Link to="/products/video-gen" className="inline-flex items-center gap-4 text-gray-500 hover:text-white mb-16 transition-all group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">Back to Research</span>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Left: Controls */}
                <div className="space-y-10">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#3B6DFF]/10 border border-[#3B6DFF]/20 text-[9px] font-black uppercase tracking-[0.5em] text-[#3B6DFF] mb-6"
                        >
                            <Zap className="w-3 h-3" />
                            Render Engine Alpha
                        </motion.div>
                        <h1 className="text-6xl font-black uppercase tracking-tighter leading-none mb-6">
                            Construct <br /> <span className="text-gradient">Shorts.</span>
                        </h1>
                        <p className="text-gray-400 font-medium leading-relaxed">
                            Describe your vision. Our RL-optimized engine identifies impactful hooks and injects cinematic visuals automatically.
                        </p>
                    </div>

                    <div className="glass p-10 rounded-[2.5rem] border-white/5 space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Core Narrative</label>
                            <textarea
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Describe the topic for your reel..."
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-8 py-6 focus:outline-none focus:border-[#3B6DFF]/50 transition-all text-sm font-medium min-h-[150px]"
                            />
                        </div>

                        {/* Aspect Ratio Selector */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Format Strategy</label>
                            <div className="grid grid-cols-3 gap-4">
                                {(['9:16', '16:9', '1:1'] as const).map((ratio) => (
                                    <button
                                        key={ratio}
                                        onClick={() => setAspectRatio(ratio)}
                                        className={`py-4 rounded-xl border font-bold text-xs transition-all ${aspectRatio === ratio
                                            ? 'bg-[#3B6DFF] border-[#3B6DFF] text-white'
                                            : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/30'
                                            }`}
                                    >
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || isExporting || !topic}
                            className="w-full bg-white text-black py-6 rounded-2xl font-black text-xs tracking-[0.4em] uppercase hover:bg-[#3B6DFF] hover:text-white transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
                        >
                            {isGenerating ? 'Synthesizing...' : (
                                <>
                                    Initialize Generation <Rocket className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                            <div className="flex -space-x-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center">
                                        <Activity className="w-4 h-4 text-[#3B6DFF]" />
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                                {status || 'System Idle'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="relative">
                    <div className="sticky top-32">
                        {/* Dynamic Aspect Ratio Container with object-contain to show all pixels */}
                        <div
                            className="glass rounded-[3rem] overflow-hidden border-white/10 relative group mx-auto transition-all duration-500 bg-black"
                            style={{
                                aspectRatio: aspectRatio.replace(':', '/'),
                                maxWidth: '100%',
                                maxHeight: '80vh'
                            }}
                        >
                            <canvas
                                ref={canvasRef}
                                width={getDimensions().width}
                                height={getDimensions().height}
                                className="w-full h-full object-contain"
                            />

                            {!captions.length && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 gap-8 pointer-events-none">
                                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                                        <Play className="w-8 h-8 text-[#3B6DFF]" />
                                    </div>
                                    <p className="text-gray-500 font-black text-xs uppercase tracking-[0.3em]">
                                        Preview Environment <br /> Waiting for Data
                                    </p>
                                </div>
                            )}

                            {/* Play Button Overlay */}
                            {captions.length > 0 && !isExporting && !isPlaying && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all cursor-pointer group-hover:bg-black/20"
                                    onClick={togglePlayback}>
                                    <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:scale-110 transition-transform">
                                        <Play className="w-8 h-8 text-white fill-white" />
                                    </div>
                                </div>
                            )}

                            {/* Stop Overlay (Click anywhere to stop) */}
                            {isPlaying && (
                                <div className="absolute inset-0 z-10" onClick={togglePlayback} />
                            )}

                            {/* Export Overlay */}
                            {isExporting && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-20 gap-8 z-50">
                                    <Sparkles className="w-12 h-12 text-[#3B6DFF] animate-spin" />
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="h-full bg-[#3B6DFF] shadow-[0_0_20px_#3B6DFF]"
                                        />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Exporting 4K Assets: {Math.round(progress)}%</span>
                                </div>
                            )}
                        </div>

                        {captions.length > 0 && !isExporting && (
                            <div className="flex flex-col gap-4 mt-8 w-full">
                                <motion.button
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={handleExport}
                                    className="w-full glass py-6 rounded-2xl font-black text-xs tracking-[0.4em] uppercase border-[#3B6DFF]/30 text-[#3B6DFF] hover:bg-[#3B6DFF] hover:text-white transition-all flex items-center justify-center gap-4 group"
                                >
                                    Download MP4 <Download className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                                </motion.button>

                                {lastExportUrl && (
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-2">Download didn't start?</p>
                                        <a
                                            href={lastExportUrl}
                                            download={`reel-manual-${Date.now()}.mp4`}
                                            target="_blank"
                                            className="text-[#3B6DFF] text-xs font-bold underline hover:text-white transition-colors"
                                        >
                                            Click here to download file manually
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoMaker;
