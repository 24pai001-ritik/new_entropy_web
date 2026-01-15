import { GoogleGenerativeAI } from "@google/generative-ai";

const keys = [
    "AIzaSyD4ejD2PPL_iKhj2xu-emWyspI6o-9Hoy8",
    "AIzaSyDgvk-nnwInIcLCx0VGVqA_7TXGe4CNM5s"
];

async function testKey(apiKey: string, index: number) {
    console.log(`\n--- TESTING KEY ${index + 1}: ${apiKey.substring(0, 10)}... ---`);
    const genAI = new GoogleGenerativeAI(apiKey);

    // 1. Test gemini-2.5-flash (Text)
    try {
        console.log("Testing gemini-2.5-flash (Text generation)...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Say 'Hello, I am Gemini 2.5 Flash' if you are working.");
        console.log("Response:", result.response.text());
        console.log("SUCCESS: gemini-2.5-flash is working.");
    } catch (error: any) {
        console.error("FAILED: gemini-2.5-flash error:", error.message);
    }

    // 2. Test image generation with fallback models
    let imageSuccess = false;
    const imageModels = ["gemini-3-pro-image-preview", "gemini-2.0-flash-image"];
    for (const modelName of imageModels) {
        try {
            console.log(`\nTesting ${modelName} (Image generation)...`);
            const imgModel = genAI.getGenerativeModel({ model: modelName });
            const prompt = "Generate a simple blue circle on a white background.";
            const result = await imgModel.generateContent(prompt);
            const response = await result.response;
            let found = false;
            for (const candidate of response.candidates || []) {
                for (const part of candidate.content.parts || []) {
                    if ((part as any).inlineData) {
                        console.log(`SUCCESS: ${modelName} returned image data (base64 length: ${(part as any).inlineData.data.length})`);
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            if (found) {
                imageSuccess = true;
                break; // exit loop on success
            } else {
                console.log(`FAILED: ${modelName} did not return inlineData.`);
            }
        } catch (error: any) {
            console.error(`FAILED: ${modelName} error:`, error.message);
        }
    }
    if (!imageSuccess) {
        console.log("Both image models failed. Will fallback to Unsplash placeholder.");
    }
}

async function runTests() {
    for (let i = 0; i < keys.length; i++) {
        await testKey(keys[i], i);
    }
}

runTests().catch(console.error);
