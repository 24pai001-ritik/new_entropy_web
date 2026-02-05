
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";

if (!apiKey) {
    console.error("❌ ERROR: No API key found in .env file (checked API_KEY and GEMINI_API_KEY)");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const TEXT_MODELS = [
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.0-flash-exp"
];

const IMAGE_MODELS = [
    "gemini-2.5-flash-image-preview",
    "gemini-3-pro-image-preview",
    "gemini-2.0-flash-image"
];

const AUDIO_MODELS = [
    "gemini-2.5-flash-tts",
    "gemini-2.5-pro-tts"
];

async function testTextModel(modelName: string) {
    console.log(`\n--- Testing Text: ${modelName} ---`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Respond with exactly one word: 'READY'");
        const text = result.response.text().trim();
        console.log(`✅ SUCCESS: [${modelName}] Response: "${text}"`);
        return true;
    } catch (error: any) {
        console.error(`❌ FAILED: [${modelName}] Error: ${error.message}`);
        return false;
    }
}

async function testImageModel(modelName: string) {
    console.log(`\n--- Testing Image: ${modelName} ---`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = "A clean, minimalist 3D icon of a blue robot head on a white background.";
        const result = await model.generateContent(prompt);
        const response = await result.response;

        let foundImage = false;
        for (const candidate of response.candidates || []) {
            for (const part of candidate.content.parts || []) {
                if ((part as any).inlineData) {
                    console.log(`✅ SUCCESS: [${modelName}] Generated image (Base64 length: ${(part as any).inlineData.data.length})`);
                    foundImage = true;
                    break;
                }
            }
            if (foundImage) break;
        }

        if (!foundImage) {
            console.log(`❓ WARNING: [${modelName}] Model succeeded but returned no image data.`);
        }
        return foundImage;
    } catch (error: any) {
        console.error(`❌ FAILED: [${modelName}] Error: ${error.message}`);
        return false;
    }
}

async function testAudioModel(modelName: string) {
    console.log(`\n--- Testing Audio (TTS): ${modelName} ---`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // Minimal configuration for TTS if supported by SDK
        const result = await model.generateContent("Testing audio generation.");
        const response = await result.response;

        let foundAudio = false;
        for (const candidate of response.candidates || []) {
            for (const part of candidate.content.parts || []) {
                if ((part as any).inlineData) {
                    console.log(`✅ SUCCESS: [${modelName}] Generated audio (Base64 length: ${(part as any).inlineData.data.length})`);
                    foundAudio = true;
                    break;
                }
            }
            if (foundAudio) break;
        }

        if (!foundAudio) {
            console.log(`❓ WARNING: [${modelName}] Model succeeded but returned no audio data.`);
        }
        return foundAudio;
    } catch (error: any) {
        console.error(`❌ FAILED: [${modelName}] Error: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log("🚀 STARTING COMPREHENSIVE GEMINI CAPABILITY TEST");
    console.log(`🔑 Using API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);

    const results = {
        text: [] as string[],
        image: [] as string[],
        audio: [] as string[]
    };

    console.log("\n--- [ PHASE 1: TEXT MODELS ] ---");
    for (const m of TEXT_MODELS) {
        if (await testTextModel(m)) results.text.push(m);
    }

    console.log("\n--- [ PHASE 2: IMAGE MODELS ] ---");
    for (const m of IMAGE_MODELS) {
        if (await testImageModel(m)) results.image.push(m);
    }

    console.log("\n--- [ PHASE 3: AUDIO MODELS ] ---");
    for (const m of AUDIO_MODELS) {
        if (await testAudioModel(m)) results.audio.push(m);
    }

    console.log("\n\n" + "=".repeat(50));
    console.log("🏁 TEST SUMMARY");
    console.log("=".repeat(50));
    console.log("✅ Available TEXT Models:", results.text.length > 0 ? results.text.join(", ") : "NONE");
    console.log("✅ Available IMAGE Models:", results.image.length > 0 ? results.image.join(", ") : "NONE");
    console.log("✅ Available AUDIO Models:", results.audio.length > 0 ? results.audio.join(", ") : "NONE");
    console.log("=".repeat(50));
}

runAllTests().catch(console.error);
