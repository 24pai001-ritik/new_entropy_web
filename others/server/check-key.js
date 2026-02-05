const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function checkKey() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No API key found in .env");
        return;
    }
    console.log("Checking API key (prefix):", key.substring(0, 5) + "...");

    const genAI = new GoogleGenerativeAI(key);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say hello");
        console.log("Response:", result.response.text());
    } catch (error) {
        console.error("Gemini API Error:", error.message);
    }
}

checkKey();
