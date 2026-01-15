
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Polyfill fetch if needed (Node 18+ has it built-in)
// import fetch from 'node-fetch'; 

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

console.log("🔑 API Key check:", apiKey ? "Detected" : "Missing");

if (!apiKey) {
    console.error("❌ No API Key found in .env. Please set GEMINI_API_KEY.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
// Using the experimental model requested
const ttsModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

async function testGeminiTTS() {
    console.log("\n🧪 Testing Gemini Native TTS (gemini-2.5-flash-preview-tts)...");
    try {
        const text = "This is a test of the Gemini vocal engine.";
        // Note: The prompt structure depends on the specific model capability. 
        // Assuming standard generateContent with a prompt that implies audio output or just text-to-audio.
        // If the model expects specific tools, that might be needed, but 'preview-tts' usually implies direct gen.

        const result = await ttsModel.generateContent(`Generate speech for: "${text}"`);
        const response = await result.response;

        let found = false;
        if (response.candidates) {
            for (const candidate of response.candidates) {
                if (candidate.content && candidate.content.parts) {
                    for (const part of candidate.content.parts) {
                        if ((part as any).inlineData) {
                            const binaryString = atob((part as any).inlineData.data);
                            const bytes = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

                            const outputPath = path.resolve(__dirname, 'test_output_gemini.mp3');
                            fs.writeFileSync(outputPath, bytes);
                            console.log(`✅ Gemini TTS Success! Saved to: ${outputPath}`);
                            found = true;
                            break;
                        }
                    }
                }
                if (found) break;
            }
        }

        if (!found) {
            console.warn("⚠️ Gemini TTS returned successfully but no inline audio data found.");
            console.log("Raw Response parts:", JSON.stringify(response.candidates?.[0]?.content?.parts, null, 2));
        }

    } catch (error: any) {
        console.error("❌ Gemini TTS Failed:", error.message);
    }
}

async function testGoogleFallback() {
    console.log("\n🧪 Testing Google Fallback TTS (Direct HTTP)...");
    try {
        const text = "Testing the backup Google voice system.";
        const encodedText = encodeURIComponent(text);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`;

        // Mimic valid browser headers
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };

        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

        const buffer = await response.arrayBuffer();
        const outputPath = path.resolve(__dirname, 'test_output_google.mp3');
        fs.writeFileSync(outputPath, Buffer.from(buffer));
        console.log(`✅ Google TTS Success! Saved to: ${outputPath}`);

    } catch (error: any) {
        console.error("❌ Google TTS Failed:", error.message);
    }
}

(async () => {
    console.log("🎙️ Starting Independent Voice Verification...");
    await testGeminiTTS();
    await testGoogleFallback();
    console.log("\nTest Complete.");
})();
