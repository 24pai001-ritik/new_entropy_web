import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI, Modality } from "@google/genai";
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
if (!apiKey) {
    console.error("[VideoService] CRITICAL: Gemini API Key is missing! Please set VITE_GEMINI_API_KEY in your .env file.");
}
const genAI = new GoogleGenerativeAI(apiKey);

// Model Selection based on Task
const scriptModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
const wordDetectorModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Flash 2.5 is faster for processing
const imageModel = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

// High-quality TTS using the @google/genai SDK
const genAI_new = new GoogleGenAI({ apiKey });

// Fallback model for reliability
const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- AI SERVICES ---

export async function generateVideoScript(topic: string, tone: string) {
    if (!apiKey) throw new Error("Gemini API Key is missing. Please check your .env file and ensure VITE_GEMINI_API_KEY is set.");
    const PERSONA_MATRIX = `
    - **The Tech Lead**: Pragmatic, cynical about hype. Uses [sigh] for legacy code. Fast talker.
    - **The Influencer**: High energy, trend-focused. Uses [laughing] often. Dynamic pitch.
    - **The Professor**: Precise, articulate. Uses [clearing throat] before corrections.
    - **The Insight**: Warm, storytelling. Uses [short pause] for emphasis.
    `.trim();

    const prompt = `
    You are a Lead Producer for a viral media network.
    MISSION: Generate a script that sounds 100% like a real human conversation.
    
    TOPIC: "${topic}"
    TONE: ${tone}
    FORMAT: Social Media Reel/Short (30-40 seconds)

    PERSONA OPTIONS:
    ${PERSONA_MATRIX}

    DIRECTIVES:
    1. **CHEMISTRY**: Assign Speaker A as 'The Anchor' (pacing/intro) and Speaker B as 'The Expert' (depth/humor).
    2. **WRITE FOR THE EAR**:
       - Use fillers: "Look," "Listen," "Honestly," "I mean," "Actually."
       - Use interruptions: End a line with "--" if the next speaker should cut them off.
       - Natural rhythm: Break long thoughts with [short pause].
    3. **LANGUAGE (HINGLISH)**: Use a natural mix of Hindi and English. 
       - CRITICAL: Use Roman script (e.g., "Haan, bilkul sahi!").
       - Inject Hinglish idioms naturally.
    4. **TTS TAGS**: Use [laughing], [sigh], [clearing throat], [fast] for emotional depth.

    CRITICAL: Each segment text MUST be under 150 characters for stability.
    Format: Return ONLY a JSON array: [{ "speaker": "A", "persona": "The Tech Lead", "text": "..." }]`;

    try {
        console.log(`[VideoService] Generating script for topic: "${topic}"...`);
        const result = await scriptModel.generateContent(prompt);
        const text = result.response.text();
        console.log(`[VideoService] Script response received:`, text.substring(0, 100) + "...");

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const cleaned = jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        console.log(`[VideoService] Script parsed successfully. Length: ${parsed.length} segments.`);
        return parsed;
    } catch (error: any) {
        console.error("[VideoService] Script Generation Error:", error);
        console.warn("[VideoService] Primary Model Failed (Script), switching to Fallback:", error.message);
        try {
            const result = await fallbackModel.generateContent(prompt);
            const text = result.response.text();
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            const cleaned = jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, "").trim();
            return JSON.parse(cleaned);
        } catch (innerError: any) {
            throw new Error(`[Script Synthesis Failed] ${innerError.message}. This usually happens if the topic is too sensitive or the AI model is temporarily over-capacity.`);
        }
    }
}

export async function detectImpactfulWords(script: string): Promise<ImpactfulWord[]> {
    const prompt = `Analyze this video script and identify 6-8 "impactful" words or short phrases that evoke strong imagery.
    For each word, provide a very brief "emotionalIntent" (e.g. "cinematic", "energetic", "calm").
    Script: "${script}"
    Return ONLY JSON: [{ "text": "word", "emotionalIntent": "intent" }]`;

    try {
        console.log(`[VideoService] Detecting impactful words...`);
        const result = await wordDetectorModel.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const cleaned = jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, "").trim();
        const words = JSON.parse(cleaned);
        console.log(`[VideoService] Words detected:`, words.map((w: any) => w.text).join(", "));
        return words;
    } catch (error: any) {
        console.error("[VideoService] Word Detection Error:", error);
        console.warn("[VideoService] Primary Model Failed (Words), switching to Fallback:", error.message);
        try {
            const result = await fallbackModel.generateContent(prompt);
            const text = result.response.text();
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            const cleaned = jsonMatch ? jsonMatch[0] : text.replace(/```json|```/g, "").trim();
            return JSON.parse(cleaned);
        } catch (innerError: any) {
            throw new Error(`[Visual Selection Failed] ${innerError.message}. Check your internet connection or API credits.`);
        }
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

export async function generateSpeech(text: string, voice: string = 'Male'): Promise<ArrayBuffer> {

    // 1. Production: Gemini Native TTS (Optimized for quality and Hinglish delivery)
    try {
        const voiceName = voice.toLowerCase().includes('male') || voice === 'Brian' || voice === 'Orus' ? 'Orus' : 'Aoede';

        // Dynamic Persona Injection based on common traits
        const personaNote = voiceName === 'Orus' ?
            "Style: Pragmatic, tech-savvy, energetic lead. Pacing: Quick but clear." :
            "Style: Warm, insight-driven, rhythmic anchor. Pacing: Balanced and engaging.";

        const prompt = `
# AUDIO PROFILE: ${voiceName}
## MISSION: 100% Human-Like Delivery

${personaNote}

## THE SCENE: High-End Studio
Professional proximity, zero echo, intimate but clear.

### DIRECTOR'S NOTES
- **Dialect**: Native Hinglish (Hindi + English) speaker. Deliver Hindi with natural "Delhi/Mumbai" inflection.
- **English**: Modern, global, tech-savvy tone.
- **Human Drift**: Use natural micro-pauses.
- **Breath Groups**: Respect the punctuation and [short pause] tags as natural intakes of breath.
- **Tags**: If text contains [laughing], make it a short, genuine chuckle. If [sigh], make it a slight exhale of realization.

#### TRANSCRIPT
${text}
        `.trim();

        console.log(`[VideoService] Attempting Gemini Native TTS (${voiceName})...`);
        const response = await genAI_new.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: voiceName
                        }
                    }
                }
            } as any
        });

        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (data) {
            console.log(`[VideoService] Gemini TTS Success (${voiceName}). Data length: ${data.length}`);
            const binaryString = atob(data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            return bytes.buffer;
        }
    } catch (e: any) {
        console.warn("[VideoService] Gemini Native TTS failed, falling back to local proxy:", e.message);
    }

    const encodedText = encodeURIComponent(text);

    // 2. Fallback: Local Backend Proxy (Handles CORS & Fallbacks)
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
        const buffer = await response.arrayBuffer();
        console.log(`[VideoService] Backend TTS Success. Buffer size: ${buffer.byteLength} bytes`);
        if (buffer.byteLength < 100) {
            throw new Error("Received suspiciously small audio buffer from backend.");
        }
        return buffer;
    } catch (e: any) {
        console.error("Local Backend TTS Proxy failed:", e);
        throw new Error("Voice synthesis failed. Error: " + e.message);
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
    if (!data || data.length === 0) throw new Error("Audio data is empty");
    try {
        // Use a copy of the buffer to avoid issues with detached buffers in batch processing
        const bufferCopy = data.buffer.slice(0);
        return await ctx.decodeAudioData(bufferCopy as ArrayBuffer);
    } catch (e: any) {
        console.error("[VideoService] decodeAudioData failed:", e);
        // Inspection: check if it looks like HTML (common for error pages)
        const header = new TextDecoder().decode(data.slice(0, 50));
        if (header.toLowerCase().includes('<!doctype') || header.toLowerCase().includes('<html')) {
            throw new Error(`Unable to decode audio data: Received an error page from the server instead of audio. Data: ${header.substring(0, 100)}...`);
        }
        throw new Error(`Unable to decode audio data: ${e.message}`);
    }
}

/**
 * Trims silence from the start and end of an AudioBuffer.
 * This creates a much more natural, conversational flow when stitching segments.
 */
export function trimAudioBuffer(ctx: AudioContext, buffer: AudioBuffer): AudioBuffer {
    const channels = buffer.numberOfChannels;
    const data = buffer.getChannelData(0); // Detect silence based on first channel
    const len = data.length;
    const threshold = 0.005; // Approx -46dB

    // Scan start
    let start = 0;
    while (start < len && Math.abs(data[start]) < threshold) {
        start++;
    }

    // Scan end
    let end = len - 1;
    while (end > start && Math.abs(data[end]) < threshold) {
        end--;
    }

    // Pad by 50ms to avoid clipping breath
    const padding = Math.floor(ctx.sampleRate * 0.05);
    start = Math.max(0, start - padding);
    end = Math.min(len, end + padding);

    const newLen = end - start;
    if (newLen <= 0) return buffer;

    const newBuffer = ctx.createBuffer(channels, newLen, buffer.sampleRate);
    for (let c = 0; c < channels; c++) {
        const chData = buffer.getChannelData(c);
        const newChData = newBuffer.getChannelData(c);
        for (let i = 0; i < newLen; i++) {
            newChData[i] = chData[start + i];
        }
    }
    return newBuffer;
}

export function concatenateAudioBuffers(ctx: AudioContext, buffers: AudioBuffer[]): AudioBuffer {
    if (buffers.length === 0) {
        return ctx.createBuffer(1, 1, 44100);
    }
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
    drawBackground: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, w: number, h: number, hue: number, brandColors?: any) => {
        const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.sqrt(w * w + h * h) / 2);
        if (brandColors) {
            grad.addColorStop(0, brandColors.primary + '22');
            grad.addColorStop(1, '#080A0F');
        } else {
            grad.addColorStop(0, `hsla(${hue}, 80%, 10%, 1)`);
            grad.addColorStop(1, '#080A0F');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    },

    drawLogo: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, logo: CanvasImageSource, w: number, h: number) => {
        const targetW = w * 0.12;
        const padding = w * 0.04;
        const anyLogo = logo as any;
        const imgW = anyLogo.width || anyLogo.naturalWidth || 100;
        const imgH = anyLogo.height || anyLogo.naturalHeight || 100;
        const ratio = imgW / imgH;
        const dW = targetW;
        const dH = targetW / ratio;

        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.drawImage(logo, w - dW - padding, padding, dW, dH);
        ctx.restore();
    },

    drawImpactfulImage: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, img: CanvasImageSource | ImageBitmap, time: number, start: number, end: number, w: number, h: number, motion: 'scale' | 'fade' = 'scale') => {
        const duration = end - start;
        const progress = (time - start) / duration;
        if (progress < 0 || progress > 1) return;

        ctx.save();
        let scale = 1.0;
        let opacity = progress < 0.2 ? progress / 0.2 : progress > 0.8 ? (1 - progress) / 0.2 : 1;

        if (motion === 'scale') {
            scale = 1.0 + (progress * 0.15);
        }

        ctx.globalAlpha = opacity * 0.8;
        ctx.translate(w / 2, h / 2);
        ctx.scale(scale, scale);
        ctx.translate(-w / 2, -h / 2);

        const imgW = (img as any).width || w;
        const imgH = (img as any).height || h;
        const ratio = imgW / imgH;
        const canvasRatio = w / h;

        let dW, dH;
        if (ratio > canvasRatio) {
            dH = h; dW = h * ratio;
        } else {
            dW = w; dH = w / ratio;
        }

        ctx.drawImage(img, (w - dW) / 2, (h - dH) / 2, dW, dH);
        ctx.restore();
    },

    drawCaptions: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, text: string, w: number, h: number, hue: number, brandColors?: any) => {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const fontSize = Math.floor(w * 0.07);
        ctx.font = `900 ${fontSize}px Inter, system-ui, sans-serif`;

        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = fontSize * 0.3;

        // Multi-line wrap
        const words = text.toUpperCase().split(' ');
        let line = '';
        const lines = [];
        const maxWidth = w * 0.85;
        const lineHeight = fontSize * 1.2;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const testWidth = ctx.measureText(testLine).width;
            if (testWidth > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);

        const totalHeight = lines.length * lineHeight;
        const boxPadding = fontSize * 0.5;
        const boxY = h * 0.8 - totalHeight / 2;

        // Draw background box
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        // Fallback for roundRect
        const boxW = maxWidth + boxPadding * 2;
        const boxX = (w - boxW) / 2;
        if ((ctx as any).roundRect) {
            (ctx as any).roundRect(boxX, boxY - boxPadding, boxW, totalHeight + boxPadding * 2, 20);
        } else {
            ctx.fillRect(boxX, boxY - boxPadding, boxW, totalHeight + boxPadding * 2);
        }
        ctx.fill();

        // Draw Text
        ctx.fillStyle = brandColors?.text || 'white';
        lines.forEach((l, i) => {
            const y = boxY + (i * lineHeight);
            const isHighlightLine = i === Math.floor(lines.length / 2);
            if (isHighlightLine && brandColors) {
                ctx.fillStyle = brandColors.primary;
            } else {
                ctx.fillStyle = brandColors?.text || 'white';
            }
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
    height: number = 1920,
    logo: string | null = null,
    brandColors: any = null,
    firstImage: string | null = null,
    lastImage: string | null = null
): Promise<Blob> {
    const fps = 30;
    const duration = audioBuffer.duration;

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d')!;

    // Pre-load images
    const bitmaps = new Map<string, ImageBitmap>();
    await Promise.all(impactfulImages.map(async img => {
        if (!img.url) return;
        try {
            const r = await fetch(img.url);
            if (!r.ok) throw new Error(`Image fetch failed: ${r.statusText}`);
            bitmaps.set(img.url, await createImageBitmap(await r.blob()));
        } catch (e) {
            console.warn(`[VideoService] Failed to load scene image: ${img.url}`, e);
        }
    }));

    // Pre-load Branding Assets
    let logoBitmap: ImageBitmap | null = null;
    if (logo) {
        try {
            const r = await fetch(logo);
            logoBitmap = await createImageBitmap(await r.blob());
        } catch (e) { }
    }

    let firstBitmap: ImageBitmap | null = null;
    if (firstImage) {
        try {
            const r = await fetch(firstImage);
            firstBitmap = await createImageBitmap(await r.blob());
        } catch (e) { }
    }

    let lastBitmap: ImageBitmap | null = null;
    if (lastImage) {
        try {
            const r = await fetch(lastImage);
            lastBitmap = await createImageBitmap(await r.blob());
        } catch (e) { }
    }

    console.log("Initializing Muxer...");
    let muxer: Muxer<ArrayBufferTarget>;
    try {
        muxer = new Muxer({
            target: new ArrayBufferTarget(),
            video: { codec: 'avc', width, height },
            audio: { codec: 'aac', numberOfChannels: 2, sampleRate: audioBuffer.sampleRate },
            fastStart: false
        });
    } catch (e: any) {
        throw new Error(`Muxer Initialization Failed: ${e.message}. Your browser might not support the required video codecs.`);
    }

    const vEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: e => {
            console.error("VideoEncoder Error:", e);
            throw new Error(`Video Encoder Error: ${e.message}`);
        }
    });

    const aEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: e => {
            console.error("AudioEncoder Error:", e);
            throw new Error(`Audio Encoder Error: ${e.message}`);
        }
    });

    const audioSampleRate = audioBuffer.sampleRate;
    const numberOfChannels = 2;

    vEncoder.configure({ codec: 'avc1.4d002a', width, height, bitrate: 8_000_000, framerate: fps });
    aEncoder.configure({ codec: 'mp4a.40.2', sampleRate: audioSampleRate, numberOfChannels, bitrate: 128_000 });

    try {
        const audioDataArray = new Float32Array(audioBuffer.length * numberOfChannels);
        const channels = [];
        for (let ch = 0; ch < numberOfChannels; ch++) {
            channels.push(audioBuffer.getChannelData(ch % audioBuffer.numberOfChannels));
        }

        for (let i = 0; i < audioBuffer.length; i++) {
            for (let ch = 0; ch < numberOfChannels; ch++) {
                audioDataArray[i * numberOfChannels + ch] = channels[ch][i];
            }
        }

        const chunkSize = 4096 * 4;
        const totalFrames = audioBuffer.length;

        for (let i = 0; i < totalFrames; i += chunkSize) {
            const remaining = totalFrames - i;
            const currentChunkSize = Math.min(chunkSize, remaining);
            const chunkData = audioDataArray.slice(i * numberOfChannels, (i + currentChunkSize) * numberOfChannels);
            const timestamp = Math.round((i / audioSampleRate) * 1_000_000);

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
        try {
            const time = i / fps;
            const hue = (time * 20) % 360;

            Visualizer.drawBackground(ctx, width, height, hue, brandColors);

            // Branding Sequence
            if (firstBitmap && time <= 3) {
                Visualizer.drawImpactfulImage(ctx, firstBitmap, time, 0, 3, width, height, 'scale');
            } else if (lastBitmap && time >= duration - 4) {
                Visualizer.drawImpactfulImage(ctx, lastBitmap, time, duration - 4, duration, width, height, 'fade');
            } else {
                const img = impactfulImages.find(im => time >= im.start && time <= im.end);
                if (img && bitmaps.has(img.url)) {
                    Visualizer.drawImpactfulImage(ctx, bitmaps.get(img.url)!, time, img.start, img.end, width, height);
                }
            }

            const cap = captions.find(c => time >= c.start && time <= c.end);
            if (cap) Visualizer.drawCaptions(ctx, cap.text, width, height, hue, brandColors);

            if (logoBitmap) {
                Visualizer.drawLogo(ctx, logoBitmap, width, height);
            }

            const frame = new VideoFrame(canvas, { timestamp: time * 1_000_000 });

            // Encoder Queue Management
            if (vEncoder.encodeQueueSize > 10) {
                await vEncoder.flush();
            }

            vEncoder.encode(frame);
            frame.close();

            if (i % 30 === 0) {
                onProgress((i / (duration * fps)) * 100);
            }
        } catch (frameError) {
            console.warn(`Error rendering frame ${i}:`, frameError);
            // Continue rendering other frames instead of failing completely
        }
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

