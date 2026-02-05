import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    console.log('Listing available Gemini models via raw fetch...');
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json() as any;

        if (data.error) {
            console.error('API Error:', data.error.message);
            console.error('Status:', data.error.code);
            return;
        }

        console.log('Available Models:');
        if (data.models) {
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (${m.displayName})`);
            });
        } else {
            console.log('No models returned in the list.');
        }
    } catch (error: any) {
        console.error('Fetch Error:', error.message);
    }
}

listModels();
