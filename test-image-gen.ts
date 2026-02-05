import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDs-t-kfA3I1rnOxb-mqbXg6NGjz3JIvY4"; // User provided key

async function runDiagnostics() {
    console.log("----------------------------------------");
    console.log("🔍 API Key Diagnostic Tool");
    console.log("----------------------------------------");

    const genAI = new GoogleGenerativeAI(API_KEY);

    // 1. Test Basic Text Generation (Key Validation)
    console.log("\n[1/2] Testing Text Generation (Gemini 2.5 Flash)...");
    try {
        const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await textModel.generateContent("Reply with 'OK' if you can read this.");
        const response = await result.response;
        console.log("✅ Text Generation: SUCCESS");
        console.log("Response:", response.text().trim());
    } catch (error: any) {
        console.error("❌ Text Generation: FAILED");
        console.error("Scale of failure: Key might be invalid or quota exceeded.");
        console.error("Error:", error.message);
        return; // Basic key failure, stop here.
    }

    // 2. Test Image Generation
    console.log("\n[2/2] Testing Image Generation (Gemini 3 Pro Image Preview)...");
    try {
        const imageModel = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });
        const prompt = "A cute robot drawing a picture, vector art style.";
        const result = await imageModel.generateContent(prompt);
        const response = await result.response;

        // Inspect candidates
        let hasImage = false;
        if (response.candidates) {
            for (const c of response.candidates) {
                if (c.content?.parts?.some((p: any) => p.inlineData)) {
                    hasImage = true;
                    break;
                }
            }
        }

        if (hasImage) {
            console.log("✅ Image Generation: SUCCESS (Image data received)");
        } else {
            console.warn("⚠️ Image Generation: COMPLETED but NO IMAGE found in response.");
            console.log(JSON.stringify(response, null, 2));
        }

    } catch (error: any) {
        console.error("❌ Image Generation: FAILED");
        console.error("Error Message:", error.message);
        // Check for common issues
        if (error.message.includes("404") || error.message.includes("not found")) {
            console.error(">> Suggestion: The model 'gemini-3-pro-image-preview' might not be enabled for this key or region.");
        } else if (error.message.includes("429")) {
            console.error(">> Suggestion: Rate limit exceeded or quota exhausted.");
        }
    }
    console.log("\n----------------------------------------");
}

runDiagnostics();
