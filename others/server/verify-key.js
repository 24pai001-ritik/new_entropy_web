const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Verification script for API Key: AIzaSyDgvk-nnwInIcLCx0VGVqA_7TXGe4CNM5s
 */
async function verifyKey() {
    const API_KEY = "AIzaSyDIk8L66xPJWwkEvx5pgfY0-2UJBhpDW3U";
    console.log("-----------------------------------------");
    console.log("STARTING API KEY VERIFICATION...");
    console.log(`Key Prefix: ${API_KEY.substring(0, 10)}...`);

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        // Using gemini-2.5-flash for the check
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        console.log("Sending test request (Prompt: 'Integrity Check')...");
        const result = await model.generateContent("Integrity Check: Please respond with 'OK' if you can read this.");
        const response = await result.response;
        const text = response.text();

        console.log("-----------------------------------------");
        console.log("✅ SUCCESS!");
        console.log("Model Response:", text);
        console.log("This API key is active and functional.");
        console.log("-----------------------------------------");
    } catch (error) {
        console.log("-----------------------------------------");
        console.log("❌ VERIFICATION FAILED");
        console.log("Full Error Object:", JSON.stringify(error, null, 2));

        if (error.status === 403) {
            console.log("Hint: This usually means the key is invalid, expired, or restricted.");
        } else if (error.message && error.message.includes("leaked")) {
            console.log("Hint: Google has detected this key as publicly exposed and disabled it.");
        }
        console.log("-----------------------------------------");
    }
}

verifyKey();
