
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { Caption, VisualizerMode, CaptionStyle, Particle } from '../types';
import * as Visualizer from './visualizerCanvas';

// Type declarations for WebCodecs API
declare class AudioEncoder {
    constructor(init: {
        output: (chunk: any, meta?: any) => void;
        error: (e: any) => void;
    });
    configure(config: {
        codec: string;
        numberOfChannels: number;
        sampleRate: number;
        bitrate?: number;
    }): void;
    encode(data: AudioData): void;
    flush(): Promise<void>;
    close(): void;
    readonly state: string;
}

declare class AudioData {
    constructor(init: {
        format: string;
        sampleRate: number;
        numberOfFrames: number;
        numberOfChannels: number;
        timestamp: number;
        data: BufferSource;
    });
    close(): void;
}

interface RenderOptions {
    audioBuffer: AudioBuffer;
    captions: Caption[];
    topic: string;
    visualizerMode: VisualizerMode;
    captionStyle: CaptionStyle;
    aspectRatio: string;
    logo: string | null;
    impactfulImages?: any[];
    onProgress: (percent: number) => void;
}

export const renderVideoToBlob = async ({
    audioBuffer,
    captions,
    topic,
    visualizerMode,
    captionStyle,
    aspectRatio,
    logo,
    impactfulImages,
    onProgress
}: RenderOptions): Promise<Blob> => {

    // 0. RESAMPLE AUDIO TO 48kHz (Video Standard)
    const TARGET_SAMPLE_RATE = 48000;
    let targetAudioBuffer = audioBuffer;

    if (audioBuffer.sampleRate !== TARGET_SAMPLE_RATE) {
        const newLength = Math.ceil(audioBuffer.length * TARGET_SAMPLE_RATE / audioBuffer.sampleRate);
        const resampleCtx = new OfflineAudioContext(2, newLength, TARGET_SAMPLE_RATE);
        const src = resampleCtx.createBufferSource();
        src.buffer = audioBuffer;
        src.connect(resampleCtx.destination);
        src.start(0);
        targetAudioBuffer = await resampleCtx.startRendering();
    }

    // 1. Setup Canvas
    const [width, height] = aspectRatio === '16:9' ? [1920, 1080] :
        aspectRatio === '9:16' ? [1080, 1920] :
            aspectRatio === '1:1' ? [1080, 1080] :
                aspectRatio === '4:3' ? [1440, 1080] : [1920, 1080];

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create offscreen context");

    // Load Logo Bitmap if exists
    let logoBitmap: ImageBitmap | null = null;
    if (logo) {
        try {
            const resp = await fetch(logo);
            const blob = await resp.blob();
            logoBitmap = await createImageBitmap(blob);
        } catch (e) {
            console.warn("Failed to load logo for video rendering", e);
        }
    }

    // Load Impactful Image Bitmaps
    const impactBitmaps = new Map<string, ImageBitmap>();
    if (impactfulImages) {
        await Promise.all(impactfulImages.map(async (img) => {
            try {
                const resp = await fetch(img.url);
                const blob = await resp.blob();
                const bitmap = await createImageBitmap(blob);
                impactBitmaps.set(img.url, bitmap);
            } catch (e) {
                console.warn("Failed to load impactful image for video rendering", e);
            }
        }));
    }

    // 2. Setup Muxer
    const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: {
            codec: 'avc', // H.264
            width,
            height
        },
        audio: {
            codec: 'aac',
            numberOfChannels: 2,
            sampleRate: TARGET_SAMPLE_RATE
        },
        fastStart: 'in-memory',
    });

    // 3. Setup Encoders
    const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => console.error("Video Encode Error", e)
    });

    videoEncoder.configure({
        codec: 'avc1.4d002a',
        width,
        height,
        bitrate: 6_000_000,
        framerate: 30
    });

    const audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => console.error("Audio Encode Error", e)
    });

    audioEncoder.configure({
        codec: 'mp4a.40.2', // AAC LC
        numberOfChannels: 2,
        sampleRate: TARGET_SAMPLE_RATE,
        bitrate: 128_000
    });

    // 4. Offline Audio Processing (Fast extraction for Visualizer)
    const offlineCtx = new OfflineAudioContext(2, targetAudioBuffer.length, TARGET_SAMPLE_RATE);
    const source = offlineCtx.createBufferSource();
    source.buffer = targetAudioBuffer;

    const analyser = offlineCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    source.connect(analyser);
    analyser.connect(offlineCtx.destination);
    source.start(0);

    // 5. Encode Audio Track
    const totalSamples = targetAudioBuffer.length;
    const chunkSize = TARGET_SAMPLE_RATE; // 1 second chunks
    for (let i = 0; i < totalSamples; i += chunkSize) {
        const end = Math.min(i + chunkSize, totalSamples);
        const len = end - i;
        const chunkBuffer = new AudioBuffer({
            length: len,
            numberOfChannels: 2,
            sampleRate: TARGET_SAMPLE_RATE
        });

        for (let c = 0; c < 2; c++) {
            const channelData = targetAudioBuffer.getChannelData(c % targetAudioBuffer.numberOfChannels);
            const chunkData = chunkBuffer.getChannelData(c);
            for (let j = 0; j < len; j++) {
                chunkData[j] = channelData[i + j];
            }
        }

        const audioData = new AudioData({
            format: 'f32',
            sampleRate: TARGET_SAMPLE_RATE,
            numberOfFrames: len,
            numberOfChannels: 2,
            timestamp: (i / TARGET_SAMPLE_RATE) * 1_000_000, // microseconds
            data: new Float32Array(chunkBuffer.length * 2).map((_, idx) => {
                const ch0 = chunkBuffer.getChannelData(0);
                const ch1 = chunkBuffer.getChannelData(1);
                const frameIndex = Math.floor(idx / 2);
                const channel = idx % 2;
                return channel === 0 ? ch0[frameIndex] : ch1[frameIndex];
            })
        });
        audioEncoder.encode(audioData);
        audioData.close();
    }


    // 6. Render Video Loop (Recursive Scheduling)
    const duration = targetAudioBuffer.duration;
    const fps = 30;
    const totalFrames = Math.ceil(duration * fps);

    let hue = 0;
    const particles: Particle[] = [];
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const timeArray = new Uint8Array(analyser.frequencyBinCount);

    let frameIndex = 0;

    return new Promise<Blob>((resolve, reject) => {

        const processFrame = async () => {
            try {
                if (frameIndex >= totalFrames) {
                    offlineCtx.resume();
                    return;
                }

                const time = frameIndex / fps;

                // --- VISUALIZATION DRAWING ---
                analyser.getByteFrequencyData(dataArray);
                analyser.getByteTimeDomainData(timeArray);

                hue = (hue + 0.5) % 360;

                // Background
                const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.85);
                bgGrad.addColorStop(0, `hsl(${hue}, 60%, 5%)`);
                bgGrad.addColorStop(0.5, `hsl(${(hue + 40) % 360}, 50%, 8%)`);
                bgGrad.addColorStop(1, `hsl(${(hue + 80) % 360}, 60%, 4%)`);
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, width, height);

                // Visualizer
                if (visualizerMode === 'circle') Visualizer.drawCircleVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'bars') Visualizer.drawBarsVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'wave') Visualizer.drawWaveVisualizer(ctx, timeArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'particles') Visualizer.drawParticlesVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue, particles);
                else if (visualizerMode === 'matrix') Visualizer.drawMatrixVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'kaleidoscope') Visualizer.drawKaleidoscopeVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'face') Visualizer.drawFaceVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'orb') Visualizer.drawOrbVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'geometric') Visualizer.drawGeometricVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'plasma') Visualizer.drawPlasmaVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                // New Visualizers
                else if (visualizerMode === 'dna') Visualizer.drawDNAVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'neuralNet') Visualizer.drawNeuralNetVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'galaxy') Visualizer.drawGalaxyVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'landscape') Visualizer.drawLandscapeVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'ripple') Visualizer.drawRippleVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'hexGrid') Visualizer.drawHexGridVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'newsRadar') Visualizer.drawNewsRadarVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'string') Visualizer.drawStringVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'flower') Visualizer.drawFlowerVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);
                else if (visualizerMode === 'digitalRain') Visualizer.drawDigitalRainVisualizer(ctx, dataArray, analyser.frequencyBinCount, width, height, hue);

                // Vignette
                const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.35, width / 2, height / 2, width * 0.95);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(1, 'rgba(0,0,0,0.8)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);

                // Captions
                const activeCaption = captions.find(c => time >= c.start && time <= c.end);
                if (activeCaption) {
                    Visualizer.drawCaptions(ctx, activeCaption, time, width, height, captionStyle, hue);
                } else {
                    Visualizer.drawTitleCard(ctx, topic, width, height, hue);
                }

                // Impactful Images
                const activeImpactImg = impactfulImages?.find(img => time >= img.start && time <= img.end);
                if (activeImpactImg && impactBitmaps.has(activeImpactImg.url)) {
                    Visualizer.drawImpactfulImage(ctx, impactBitmaps.get(activeImpactImg.url)!, time, activeImpactImg.start, activeImpactImg.end, width, height);
                }

                // Draw Logo
                if (logoBitmap) {
                    Visualizer.drawLogo(ctx, logoBitmap, width, height);
                }

                // Progress Bar
                const progress = time / duration;
                ctx.fillStyle = `hsl(${(hue + 180) % 360}, 100%, 60%)`;
                ctx.fillRect(0, height - 12, width * progress, 12);

                // --- VIDEO ENCODING ---
                // @ts-ignore
                const frame = new VideoFrame(canvas, { timestamp: time * 1_000_000 });

                if (videoEncoder.encodeQueueSize > 10) {
                    await videoEncoder.flush();
                }

                videoEncoder.encode(frame, { keyFrame: frameIndex % 60 === 0 });
                frame.close();

                if (frameIndex % 5 === 0) {
                    onProgress(frameIndex / totalFrames);
                }

                frameIndex++;

                if (frameIndex < totalFrames) {
                    const nextTime = frameIndex / fps;
                    offlineCtx.suspend(nextTime).then(processFrame);
                    offlineCtx.resume();
                } else {
                    offlineCtx.resume();
                }
            } catch (err) {
                reject(err);
            }
        };

        offlineCtx.oncomplete = async () => {
            try {
                await videoEncoder.flush();
                await audioEncoder.flush();
                muxer.finalize();
                const { buffer } = muxer.target;
                resolve(new Blob([buffer], { type: 'video/mp4' }));
            } catch (e) {
                reject(e);
            }
        };

        offlineCtx.suspend(0).then(processFrame);
        offlineCtx.startRendering().catch(reject);
    });
};