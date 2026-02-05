import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export class EmbeddingService {
    /**
     * Generates a 768-dimensional embedding for a given text using Gemini.
     */
    static async generateEmbedding(text: string): Promise<number[]> {
        const model = genAI.getGenerativeModel({ model: "embedding-001" });
        const result = await model.embedContent(text);
        const values = result.embedding.values;
        console.log(`Embedding generated: ${values.length} dims`);
        return values;
    }

    /**
     * Generates multi-turn chat responses using Gemini with history and context.
     */
    static async generateChatResponse(systemInstruction: string, context: string, userQuestion: string, history: { role: string, content: string }[] = []): Promise<string> {
        try {
            console.log('Generating expert chat response with memory...');
            const modelName = "gemini-2.5-flash";
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemInstruction + " You are a subject matter expert. You MUST remember and acknowledge personal details the user has shared in the conversation history (like their name). Be professional and authoritative yet personable.",
                generationConfig: {
                    temperature: 1.0,
                    // @ts-ignore
                    thinking_level: "medium"
                }
            });

            // Format history for the prompt
            const historyPrompt = history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

            const prompt = `
Objective: You are a subject matter expert providing authoritative guidance. 

Instructions:
1. Review the conversation history and the knowledge base context.
2. If the user previously shared their name or other details, use them naturally in your response. Do NOT say "I remember your name" - just use it.
3. If the knowledge base does not contain the answer, use your expert general knowledge to provide a helpful response.

Knowledge Base Context:
${context}

Active Conversation History:
${historyPrompt}

Current User Question: ${userQuestion}

Direct Expert Response:
`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error('Gemini API Error:', {
                message: error.message,
                status: error.status,
                statusText: error.statusText,
                stack: error.stack
            });

            if (error.status === 404) {
                return "The intelligence node (Gemini 1.5 Flash) appears to be offline or unreachable (404). Please verify API key and model availability.";
            }
            throw error;
        }
    }
}
