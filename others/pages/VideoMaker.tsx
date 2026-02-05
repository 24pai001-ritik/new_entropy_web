
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Rocket, Zap, Play, Download, Sparkles, Activity, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as VideoService from '../services/videoService';
import { ImpactfulImage, ImpactfulWord } from '../types';

const VideoMaker: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [lastExportUrl, setLastExportUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [script, setScript] = useState<any[]>([]);
    const [captions, setCaptions] = useState<any[]>([]);
    const [impactImages, setImpactImages] = useState<ImpactfulImage[]>([]);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [voicePreference, setVoicePreference] = useState<'Male' | 'Female'>('Male');

    // Branding Assets
    const [logo, setLogo] = useState<string | null>(null);
    const [firstImage, setFirstImage] = useState<string | null>(null);
    const [lastImage, setLastImage] = useState<string | null>(null);
    const [brandColors, setBrandColors] = useState({
        primary: '#3B6DFF',
        secondary: '#8B5CF6',
        text: '#FFFFFF',
        accent: '#F43F5E'
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const startTimeRef = useRef<number>(0);
    const loadedBitmapsRef = useRef<Map<string, HTMLImageElement>>(new Map());
    const logoImgRef = useRef<HTMLImageElement | null>(null);
    const firstImgRef = useRef<HTMLImageElement | null>(null);
    const lastImgRef = useRef<HTMLImageElement | null>(null);

    // Load Branding Refs
    useEffect(() => {
        if (logo) {
            const img = new Image(); img.src = logo;
            img.onload = () => { logoImgRef.current = img; };
        } else logoImgRef.current = null;
    }, [logo]);

    useEffect(() => {
        if (firstImage) {
            const img = new Image(); img.src = firstImage;
            img.onload = () => { firstImgRef.current = img; };
        } else firstImgRef.current = null;
    }, [firstImage]);

    useEffect(() => {
        if (lastImage) {
            const img = new Image(); img.src = lastImage;
            img.onload = () => { lastImgRef.current = img; };
        } else lastImgRef.current = null;
    }, [lastImage]);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setLogo(dataUrl);
                const img = new Image();
                img.src = dataUrl;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    canvas.width = img.width; canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    let r = 0, g = 0, b = 0, count = 0;
                    for (let i = 0; i < data.length; i += 40) {
                        if (data[i + 3] > 128) { r += data[i]; g += data[i + 1]; b += data[i + 2]; count++; }
                    }
                    if (count > 0) {
                        const toHex = (c: number) => Math.floor(c / count).toString(16).padStart(2, '0');
                        setBrandColors(prev => ({ ...prev, primary: `#${toHex(r)}${toHex(g)}${toHex(b)}` }));
                    }
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAssetUpload = (field: 'firstImage' | 'lastImage', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (field === 'firstImage') setFirstImage(reader.result as string);
                else setLastImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

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
        let currentStage = 'Initializing';
        try {
            currentStage = 'Synthesizing Script';
            setStatus(`${currentStage}...`);
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current = audioCtx;
            const scriptData = await VideoService.generateVideoScript(topic, 'Energetic');
            setScript(scriptData);

            currentStage = 'Detecting Visual Highlights';
            setStatus(`${currentStage}...`);
            const fullText = scriptData.map((s: any) => s.text).join(' ');
            const impactfulWords = await VideoService.detectImpactfulWords(fullText);
            console.log('Impactful words detected:', impactfulWords);

            currentStage = 'Generating Voice & Images';
            setStatus('Creating AI assets...');

            const processedSegments = [];
            const batchSize = 2; // Process 2 segments at a time to avoid rate limits

            for (let i = 0; i < scriptData.length; i += batchSize) {
                const batch = scriptData.slice(i, i + batchSize);
                const batchPromises = batch.map(async (seg: any, batchIdx: number) => {
                    const index = i + batchIdx;
                    try {
                        setStatus(`Processing scene ${index + 1} of ${scriptData.length}...`);

                        // Use persona-specific voice if available, otherwise fallback to preference
                        let selectedVoice = voicePreference;
                        if (seg.speaker === 'A') selectedVoice = voicePreference === 'Male' ? 'Orus' : 'Aoede';
                        if (seg.speaker === 'B') selectedVoice = voicePreference === 'Male' ? 'Aoede' : 'Orus'; // Switch for B to create chemistry

                        console.log(`[VideoMaker] Scene ${index + 1}: Speaker ${seg.speaker}, Persona ${seg.persona || 'None'}, Voice ${selectedVoice}`);

                        // Start speech generation
                        const speechPromise = VideoService.generateSpeech(seg.text, selectedVoice);

                        // Check for impact word in this segment
                        const impact = impactfulWords.find((w: any) => seg.text.toLowerCase().includes(w.text.toLowerCase()));
                        let imagePromise = Promise.resolve(null as string | null);

                        if (impact) {
                            const { orientation } = getDimensions();
                            imagePromise = VideoService.fetchImpactImage(impact.text, impact.emotionalIntent || '', orientation, {
                                fullScript: fullText,
                                allKeywords: impactfulWords.map(w => w.text)
                            });
                        }

                        const [speechBuffer, imageUrl] = await Promise.all([speechPromise, imagePromise]);
                        const decodedAudioRaw = await VideoService.decodeAudioData(new Uint8Array(speechBuffer), audioCtx);
                        const decodedAudio = VideoService.trimAudioBuffer(audioCtx, decodedAudioRaw);

                        return {
                            decodedAudio,
                            imageUrl,
                            impactWord: impact?.text,
                            text: seg.text
                        };
                    } catch (e: any) {
                        console.error(`Error processing segment ${index}:`, e);
                        throw new Error(`Scene ${index + 1} failed: ${e.message}`);
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                processedSegments.push(...batchResults);

                // Add a small delay between batches to be kind to the TTS providers
                if (i + batchSize < scriptData.length) {
                    await new Promise(r => setTimeout(r, 500));
                }
            }

            currentStage = 'Finalizing Composition';
            setStatus(`${currentStage}...`);

            const newImpactImages: ImpactfulImage[] = [];
            const newCaptions: any[] = [];
            const audioBuffers: AudioBuffer[] = [];
            let currentTime = 0;

            for (const res of processedSegments) {
                if (!res) continue;

                const duration = res.decodedAudio.duration;
                audioBuffers.push(res.decodedAudio);
                newCaptions.push({ text: res.text, start: currentTime, end: currentTime + duration });

                if (res.imageUrl) {
                    newImpactImages.push({
                        url: res.imageUrl,
                        word: res.impactWord || '',
                        start: currentTime,
                        end: currentTime + duration
                    });
                    const img = new Image();
                    img.src = res.imageUrl;
                    img.onload = () => loadedBitmapsRef.current.set(res.imageUrl!, img);
                }

                currentTime += duration;
            }

            setCaptions(newCaptions);
            setImpactImages(newImpactImages);
            setAudioBuffer(VideoService.concatenateAudioBuffers(audioCtx, audioBuffers));
            setStatus('Ready to Play');
            setError(null);
        } catch (error: any) {
            console.error(`[VideoMaker] Generation failed at stage: ${currentStage}`, error);
            const errMsg = error.message || 'Unknown error occurred';
            setStatus(`Failed during ${currentStage}`);
            setError(`[${currentStage}] ${errMsg}. This is often caused by temporary rate limits. Please try again in a few moments.`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExport = async () => {
        if (!audioBuffer || captions.length === 0) {
            setError("Cannot export: No video content generated. Please click 'Initialize Generation' first.");
            return;
        }
        setIsExporting(true);
        setError(null);
        try {
            const { width, height } = getDimensions();
            console.log('[VideoMaker] Starting Export...', { width, height, scenes: captions.length });
            const blob = await VideoService.renderVideoToBlob(audioBuffer, captions, impactImages, (p) => setProgress(p), width, height, logo, brandColors, firstImage, lastImage);
            const url = URL.createObjectURL(blob);
            setLastExportUrl(url);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reel-${Date.now()}.mp4`;
            a.click();
        } catch (e: any) {
            window.alert(`Export Failed: ${e.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    const togglePlayback = () => {
        if (!audioBuffer || !audioCtxRef.current) return;
        if (isPlaying) {
            if (audioSourceRef.current) { audioSourceRef.current.stop(); audioSourceRef.current = null; }
            setIsPlaying(false);
        } else {
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

    useEffect(() => {
        if (!canvasRef.current || captions.length === 0) return;
        const ctx = canvasRef.current.getContext('2d')!;
        let animFrame: number;
        const loop = () => {
            let time = (isPlaying && audioCtxRef.current) ? audioCtxRef.current.currentTime - startTimeRef.current : 0;
            if (time < 0) time = 0;
            const duration = audioBuffer?.duration || 10;
            if (time > duration) time = duration;
            const hue = (time * 20) % 360;

            VideoService.Visualizer.drawBackground(ctx, canvasRef.current!.width, canvasRef.current!.height, hue, brandColors);
            if (time < 3 && firstImgRef.current) {
                VideoService.Visualizer.drawImpactfulImage(ctx, firstImgRef.current, time, 0, 3, canvasRef.current!.width, canvasRef.current!.height, 'scale');
            } else if (time > (audioBuffer?.duration || 0) - 4 && lastImgRef.current) {
                VideoService.Visualizer.drawImpactfulImage(ctx, lastImgRef.current, time, (audioBuffer?.duration || 0) - 4, audioBuffer?.duration || 0, canvasRef.current!.width, canvasRef.current!.height, 'fade');
            } else {
                const activeImg = impactImages.find(img => time >= img.start && time <= img.end);
                if (activeImg && loadedBitmapsRef.current.has(activeImg.url)) {
                    VideoService.Visualizer.drawImpactfulImage(ctx, loadedBitmapsRef.current.get(activeImg.url)!, time, activeImg.start, activeImg.end, canvasRef.current!.width, canvasRef.current!.height);
                }
            }
            const activeCap = captions.find(c => time >= c.start && time <= c.end);
            if (activeCap) VideoService.Visualizer.drawCaptions(ctx, activeCap.text, canvasRef.current!.width, canvasRef.current!.height, hue, brandColors);
            if (logoImgRef.current) VideoService.Visualizer.drawLogo(ctx, logoImgRef.current, canvasRef.current!.width, canvasRef.current!.height);

            if (isPlaying) animFrame = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(animFrame);
    }, [captions, impactImages, isPlaying, brandColors]);

    return (
        <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative overflow-hidden">
            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#080A0F]/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-12 glass rounded-[40px] border-white/5 bg-white/[0.02]"
                >
                    <div className="w-20 h-20 bg-[#3B6DFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Rocket className="w-10 h-10 text-[#3B6DFF] animate-bounce" />
                    </div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Video Maker</h2>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3B6DFF]/10 border border-[#3B6DFF]/20 text-[10px] font-black uppercase tracking-[0.3em] text-[#3B6DFF] mb-6">
                        Coming Soon to Entropy
                    </div>
                    <p className="text-gray-400 max-w-md mx-auto mb-8 font-mono text-sm">
                        Our dynamic video generation engine is undergoing a major neural upgrade. Soon you'll be able to transform ideas into high-converting shorts with even greater precision.
                    </p>
                    <Link to="/" className="inline-block bg-white text-black py-4 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#3B6DFF] hover:text-white transition-all">
                        Explore Active Nodes
                    </Link>
                </motion.div>
            </div>

            <Link to="/" className="inline-flex items-center gap-4 text-gray-500 hover:text-white mb-16 transition-all group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">Back to Home</span>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="space-y-10">
                    <div>
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#3B6DFF]/10 border border-[#3B6DFF]/20 text-[9px] font-black uppercase tracking-[0.5em] text-[#3B6DFF] mb-6">
                            <Zap className="w-3 h-3" /> Render Engine Alpha
                        </motion.div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">Construct <br /> <span className="text-gradient">Shorts.</span></h1>
                    </div>

                    <div className="glass p-10 rounded-[2.5rem] border-white/5 space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Core Narrative</label>
                            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Describe the topic for your reel..." className="w-full bg-black/40 border border-white/10 rounded-2xl px-8 py-6 focus:outline-none text-sm min-h-[120px]" />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {(['9:16', '16:9', '1:1'] as const).map((ratio) => (
                                <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`py-4 rounded-xl border font-bold text-[10px] transition-all ${aspectRatio === ratio ? 'bg-[#3B6DFF] border-[#3B6DFF] text-white' : 'bg-black/20 border-white/10 text-gray-400'}`}>
                                    {ratio}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-6 pt-6 border-t border-white/5">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Brand Identity</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-up" />
                                    <label htmlFor="logo-up" className="flex items-center justify-center h-16 bg-black/40 border border-white/10 border-dashed rounded-2xl cursor-pointer">
                                        {logo ? <img src={logo} className="h-10 object-contain" /> : <span className="text-[9px] font-bold uppercase text-gray-500">Upload Logo</span>}
                                    </label>
                                </div>
                                <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-2xl px-4">
                                    <input type="color" value={brandColors.primary} onChange={(e) => setBrandColors(p => ({ ...p, primary: e.target.value }))} className="w-8 h-8 rounded-lg bg-transparent cursor-pointer" />
                                    <span className="text-[10px] font-mono text-gray-400">{brandColors.primary}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="cursor-pointer bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2">
                                    <input type="file" onChange={e => handleAssetUpload('firstImage', e)} className="hidden" />
                                    <span className="text-[8px] font-bold uppercase text-gray-500">Intro Hook</span>
                                    {firstImage && <img src={firstImage} className="h-8 rounded" />}
                                </label>
                                <label className="cursor-pointer bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2">
                                    <input type="file" onChange={e => handleAssetUpload('lastImage', e)} className="hidden" />
                                    <span className="text-[8px] font-bold uppercase text-gray-500">Outro CTA</span>
                                    {lastImage && <img src={lastImage} className="h-8 rounded" />}
                                </label>
                            </div>
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Narrator Voice</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setVoicePreference('Male')}
                                        className={`py-3 rounded-xl border font-bold text-[9px] uppercase tracking-wider transition-all ${voicePreference === 'Male' ? 'bg-[#3B6DFF] border-[#3B6DFF] text-white' : 'bg-black/20 border-white/10 text-gray-400'}`}
                                    >
                                        Male (Orus)
                                    </button>
                                    <button
                                        onClick={() => setVoicePreference('Female')}
                                        className={`py-3 rounded-xl border font-bold text-[9px] uppercase tracking-wider transition-all ${voicePreference === 'Female' ? 'bg-[#3B6DFF] border-[#3B6DFF] text-white' : 'bg-black/20 border-white/10 text-gray-400'}`}
                                    >
                                        Female (Aoede)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 space-y-2">
                                <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest">
                                    <Activity className="w-4 h-4" /> Generation Error
                                </div>
                                <p className="text-gray-300 text-xs leading-relaxed">{error}</p>
                                <p className="text-[9px] text-gray-500 italic">Tip: Check your API key and internet connection.</p>
                            </div>
                        )}

                        <button onClick={handleGenerate} disabled={isGenerating || !topic} className="w-full bg-white text-black py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#3B6DFF] hover:text-white transition-all disabled:opacity-50">
                            {isGenerating ? 'Synthesizing...' : 'Initialize Generation'}
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <div className="sticky top-32 space-y-8">
                        <div className="glass rounded-[3rem] overflow-hidden border-white/10 relative bg-black mx-auto" style={{ aspectRatio: aspectRatio.replace(':', '/'), maxWidth: '100%', maxHeight: '70vh' }}>
                            <canvas ref={canvasRef} width={getDimensions().width} height={getDimensions().height} className="w-full h-full object-contain" />
                            {!captions.length && <div className="absolute inset-0 flex items-center justify-center"><Play className="w-12 h-12 text-white/10" /></div>}
                            {captions.length > 0 && !isPlaying && !isExporting && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer" onClick={togglePlayback}>
                                    <Play className="w-16 h-16 text-white fill-white" />
                                </div>
                            )}
                            {isExporting && (
                                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-12 gap-6">
                                    <Sparkles className="w-10 h-10 text-[#3B6DFF] animate-spin" />
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#3B6DFF]" style={{ width: `${progress}%` }} />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">Exporting Assets: {Math.round(progress)}%</span>
                                </div>
                            )}
                        </div>

                        {captions.length > 0 && !isExporting && (
                            <button onClick={handleExport} className="w-full glass py-6 rounded-2xl font-black text-[10px] uppercase tracking-widest border-[#3B6DFF]/30 text-[#3B6DFF] hover:bg-[#3B6DFF] hover:text-white transition-all">
                                Download High-Res MP4
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


export default VideoMaker;
