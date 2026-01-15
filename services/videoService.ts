
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { ImpactfulWord, ImpactfulImage } from "../types";

const getApiKey = () => {
    const vKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    const pKey = (process as any).env?.GEMINI_API_KEY;
    const aKey = (process as any).env?.API_KEY;

    const key = vKey || pKey || aKey || "";
    return key === "undefined" ? "" : key;
};

const apiKey = getApiKey();
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const imageModel = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" }); // Updated to use 3‑pro preview image model
const ttsModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

// --- AI SERVICES ---

// Fallback model for reliability
const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export async function generateVideoScript(topic: string, tone: string) {
    const prompt = `Generate a short video script (approx 30 seconds) for a Reel/Short about "${topic}". 
    Tone: ${tone}. 
    Format: Return ONLY a JSON array of segments: [{ "speaker": "A", "text": "..." }]`;

    try {
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
    } catch (error: any) {
        console.warn("Primary Model Failed (Script), switching to Fallback:", error.message);
        const result = await fallbackModel.generateContent(prompt);
        return JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
    }
}

export async function detectImpactfulWords(script: string): Promise<ImpactfulWord[]> {
    const prompt = `Analyze this video script and identify 6-8 "impactful" words or short phrases that evoke strong imagery.
    For each word, provide a very brief "emotionalIntent" (e.g. "cinematic", "energetic", "calm").
    Script: "${script}"
    Return ONLY JSON: [{ "text": "word", "emotionalIntent": "intent" }]`;

    try {
        const result = await model.generateContent(prompt);
        const words = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
        return words;
    } catch (error: any) {
        console.warn("Primary Model Failed (Words), switching to Fallback:", error.message);
        const result = await fallbackModel.generateContent(prompt);
        const words = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
        return words;
    }
}

export async function fetchImpactImage(
    word: string,
    intent: string,
    orientation: 'vertical' | 'horizontal' | 'square' = 'vertical',
    context?: { fullScript: string, allKeywords: string[] }
): Promise<string> {
    const orientationPrompt = orientation === 'vertical' ? 'optimized for a vertical 9:16 social media reel' :
        orientation === 'horizontal' ? 'optimized for a horizontal 16:9 cinematic shot' :
            'optimized for a square 1:1 post';

    let contextPrompt = "";
    if (context) {
        contextPrompt = `
        CONTEXT OF VIDEO:
        "${context.fullScript.substring(0, 500)}..."
        
        VISUAL THEME KEYWORDS FOR CONSISTENCY:
        ${context.allKeywords.slice(0, 10).join(", ")}
        `;
    }

    const prompt = `Create a high-quality, cinematic ${intent} style image representing the concept of "${word}". 
    The image should be ${orientationPrompt}. No text.
    
    ${contextPrompt}
    
    CRITICAL: Ensure the visual style matches the overall video context described above. It should look like a frame from this specific video, not a random image.`;

    // Fallback to Unsplash if image generation fails or isn't supported in current env
    const fallbackUrl = `https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop`;

    try {
        const result = await imageModel.generateContent(prompt);
        const response = await result.response;

        // Look for image data in parts
        for (const candidate of response.candidates || []) {
            for (const part of candidate.content.parts || []) {
                if ((part as any).inlineData) {
                    return `data:image/png;base64,${(part as any).inlineData.data}`;
                }
            }
        }
        console.warn("Gemini Image Model returned no inlineData. Using fallback.");
    } catch (error: any) {
        console.warn("Gemini Image Generation Failed (likely 503/Overloaded or 404):", error.message);
        // Proceed to return fallback
    }

    return fallbackUrl;
}

// --- AUDIO GENERATION (TTS) ---

export async function generateSpeech(text: string, voice: string = 'Brian'): Promise<ArrayBuffer> {

    // 1. Experimental: Gemini Native TTS
    try {
        const result = await ttsModel.generateContent(`Generate speech for: "${text}"`);
        const response = await result.response;

        for (const candidate of response.candidates || []) {
            for (const part of candidate.content.parts || []) {
                if ((part as any).inlineData) {
                    const binaryString = atob((part as any).inlineData.data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                    return bytes.buffer;
                }
            }
        }
    } catch (e: any) {
        console.warn("Gemini Native TTS failed (likely not enabled/available), falling back:", e.message);
    }

    const encodedText = encodeURIComponent(text);

    // 2. Production: Local Backend Proxy (Handles CORS & Fallbacks)
    try {
        const response = await fetch('http://localhost:5000/generate-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'TTS Proxy Failed');
        }
        return await response.arrayBuffer();
    } catch (e: any) {
        console.error("Local Backend TTS Proxy failed:", e);
        throw new Error("Failed to generate speech via backend proxy: " + e.message);
    }
}

// --- AUDIO UTILS ---

export function decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    return await ctx.decodeAudioData(data.buffer as ArrayBuffer);
}

export function concatenateAudioBuffers(ctx: AudioContext, buffers: AudioBuffer[]): AudioBuffer {
    const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
    const result = ctx.createBuffer(buffers[0].numberOfChannels, totalLength, buffers[0].sampleRate);
    let offset = 0;
    for (const b of buffers) {
        for (let i = 0; i < b.numberOfChannels; i++) result.getChannelData(i).set(b.getChannelData(i), offset);
        offset += b.length;
    }
    return result;
}

// --- VISUALIZER & RENDERING ---

export const Visualizer = {
    drawBackground: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, w: number, h: number, hue: number) => {
        const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.sqrt(w * w + h * h) / 2);
        grad.addColorStop(0, `hsla(${hue}, 80%, 10%, 1)`);
        grad.addColorStop(1, '#080A0F');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    },

    drawImpactfulImage: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, img: CanvasImageSource, time: number, start: number, end: number, w: number, h: number) => {
        const progress = (time - start) / (end - start);
        if (progress < 0 || progress > 1) return;

        ctx.save();
        const scale = 1.0 + (progress * 0.1);
        const opacity = progress < 0.2 ? progress / 0.2 : progress > 0.8 ? (1 - progress) / 0.2 : 1;
        ctx.globalAlpha = opacity * 0.6;

        ctx.translate(w / 2, h / 2);
        ctx.scale(scale, scale);
        ctx.translate(-w / 2, -h / 2);

        const imgW = (img as any).width || w;
        const imgH = (img as any).height || h;
        const ratio = imgW / imgH;
        let dW = w, dH = w / ratio;
        if (dH < h) { dH = h; dW = h * ratio; }

        ctx.drawImage(img, (w - dW) / 2, (h - dH) / 2, dW, dH);
        ctx.restore();
    },

    drawCaptions: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, text: string, w: number, h: number, hue: number) => {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Responsive Font Size
        const fontSize = Math.floor(w * 0.06); // 6% of width
        ctx.font = `900 ${fontSize}px Inter, system-ui, sans-serif`;

        // Text Shadow / Outline for readability
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = fontSize * 0.5;
        ctx.lineWidth = fontSize * 0.1;
        ctx.strokeStyle = 'black';

        ctx.fillStyle = 'white';

        // Word Wrapping Logic
        const words = text.toUpperCase().split(' ');
        let line = '';
        const lines = [];
        const maxWidth = w * 0.85; // 85% safe zone
        const lineHeight = fontSize * 1.2;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);

        // Vertical Centering for the block at the bottom third
        let startY = h * 0.75;

        // Draw Lines
        lines.forEach((l, i) => {
            const y = startY + (i * lineHeight);
            ctx.strokeText(l, w / 2, y);
            ctx.fillText(l, w / 2, y);
        });

        ctx.shadowBlur = 0;
    }
};

// --- VIDEO EXPORT ---

export async function renderVideoToBlob(
    audioBuffer: AudioBuffer,
    captions: any[],
    impactfulImages: ImpactfulImage[],
    onProgress: (p: number) => void,
    width: number = 1080,
    height: number = 1920
): Promise<Blob> {
    const fps = 30;
    const duration = audioBuffer.duration;

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d')!;

    // Pre-load images
    const bitmaps = new Map<string, ImageBitmap>();
    await Promise.all(impactfulImages.map(async img => {
        try {
            const r = await fetch(img.url);
            bitmaps.set(img.url, await createImageBitmap(await r.blob()));
        } catch (e) { }
    }));

    console.log("Initializing Muxer...");
    const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: 'avc', width, height },
        audio: { codec: 'aac', numberOfChannels: 2, sampleRate: audioBuffer.sampleRate },
        fastStart: false
    });

    const vEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: e => console.error("VideoEncoder Error:", e)
    });

    const aEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: e => console.error("AudioEncoder Error:", e)
    });

    const audioSampleRate = audioBuffer.sampleRate;
    const numberOfChannels = 2;

    vEncoder.configure({ codec: 'avc1.4d002a', width, height, bitrate: 8_000_000, framerate: fps });
    aEncoder.configure({ codec: 'mp4a.40.2', sampleRate: audioSampleRate, numberOfChannels, bitrate: 128_000 });

    try {
        console.log("Starting Audio Encoding...");
        // Encode Audio in Chunks (Robustness)
        const audioDataArray = new Float32Array(audioBuffer.length * numberOfChannels);
        // 1. Interleave entire buffer first
        for (let i = 0; i < audioBuffer.length; i++) {
            for (let ch = 0; ch < numberOfChannels; ch++) {
                audioDataArray[i * numberOfChannels + ch] = audioBuffer.getChannelData(ch)[i] || 0;
            }
        }

        const chunkSize = 4096 * 4; // Process ~0.3s chunks
        const totalFrames = audioBuffer.length;

        for (let i = 0; i < totalFrames; i += chunkSize) {
            const remaining = totalFrames - i;
            const currentChunkSize = Math.min(chunkSize, remaining);

            // Extract chunk data
            const chunkData = audioDataArray.slice(i * numberOfChannels, (i + currentChunkSize) * numberOfChannels);

            const timestamp = Math.round((i / audioSampleRate) * 1_000_000); // Microseconds

            const audioData = new AudioData({
                format: 'f32',
                sampleRate: audioSampleRate,
                numberOfFrames: currentChunkSize,
                numberOfChannels: numberOfChannels,
                timestamp: timestamp,
                data: chunkData
            });

            aEncoder.encode(audioData);
            audioData.close();
        }
    } catch (e) {
        console.error("Audio Encoding Failed:", e);
    }

    // Render Loop
    console.log(`Starting Render Loop. Total Frames: ${duration * fps}`);
    for (let i = 0; i < duration * fps; i++) {
        const time = i / fps;
        const hue = (time * 20) % 360;

        Visualizer.drawBackground(ctx, width, height, hue);

        const img = impactfulImages.find(im => time >= im.start && time <= im.end);
        if (img && bitmaps.has(img.url)) {
            Visualizer.drawImpactfulImage(ctx, bitmaps.get(img.url)!, time, img.start, img.end, width, height);
        }

        const cap = captions.find(c => time >= c.start && time <= c.end);
        if (cap) Visualizer.drawCaptions(ctx, cap.text, width, height, hue);

        const frame = new VideoFrame(canvas, { timestamp: time * 1_000_000 });
        vEncoder.encode(frame);
        frame.close();

        onProgress((i / (duration * fps)) * 100);
    }

    console.log("Flushing Encoders...");
    await vEncoder.flush();
    await aEncoder.flush();
    console.log("Finalizing Muxer...");
    muxer.finalize();

    const buffer = muxer.target.buffer;
    console.log(`Muxer Finalized. Buffer Size: ${buffer.byteLength}`);
    return new Blob([buffer], { type: 'video/mp4' });
}
