import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { PDFProcessor } from './services/pdf-processor';
import { EmbeddingService } from './services/embedding-service';
import { RAGService, supabase } from './services/rag-service';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../'))); // Serve static files (like embed-script.js)

console.log('--- BACKEND_VERSION_3_ACTIVE ---');

// Helper to handle placeholder owner_id
const getEffectiveOwnerId = (id: string | undefined | null) => {
    if (!id || id === '00000000-0000-0000-0000-000000000000') return null;
    return id;
};

// 1. PDF Upload & Chatbot Creation
app.post('/upload-pdf', upload.array('files'), async (req, res) => {
    const reqId = Date.now().toString().slice(-6);
    console.log(`[UPLOAD:${reqId}] Request received`);
    try {
        const { chatbot_name, owner_id: rawOwnerId } = req.body;
        const owner_id = getEffectiveOwnerId(rawOwnerId);
        const files = req.files as Express.Multer.File[];

        console.log(`[UPLOAD:${reqId}] Name: "${chatbot_name}", Files: ${files?.length || 0}`);

        if (!files || files.length === 0) {
            console.warn(`[UPLOAD:${reqId}] Aborted: No files uploaded`);
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Create Chatbot
        console.log(`[UPLOAD:${reqId}] Creating Chatbot record...`);
        const { data: chatbot, error: cbError } = await supabase
            .from('chatbots')
            .insert({
                name: chatbot_name,
                owner_id
            })
            .select()
            .single();

        if (cbError) {
            console.error(`[UPLOAD:${reqId}] Chatbot creation error:`, cbError);
            throw cbError;
        }
        console.log(`[UPLOAD:${reqId}] Chatbot created: ${chatbot.id}`);

        for (const file of files) {
            console.log(`[UPLOAD:${reqId}] Processing file: ${file.originalname}`);
            // Extract & Chunk
            const text = await PDFProcessor.extractText(file.buffer);
            console.log(`[UPLOAD:${reqId}] Extracted text: ${text?.length || 0} chars`);

            const chunks = PDFProcessor.chunkText(text);
            console.log(`[UPLOAD:${reqId}] Generated ${chunks.length} chunks`);

            // Create Document record
            const { data: doc, error: docError } = await supabase
                .from('documents')
                .insert({ chatbot_id: chatbot.id, owner_id, filename: file.originalname })
                .select()
                .single();

            if (docError) {
                console.error(`[UPLOAD:${reqId}] Document record creation failed:`, docError);
                throw docError;
            }

            console.log(`[UPLOAD:${reqId}] Document record created: ${doc.id}`);

            // Generate Embeddings and Save Chunks
            console.log(`[UPLOAD:${reqId}] Generating embeddings for ${chunks.length} chunks...`);
            const chunkData = await Promise.all(chunks.map(async (chunk, index) => {
                const embedding = await EmbeddingService.generateEmbedding(chunk);
                return {
                    document_id: doc.id,
                    chatbot_id: chatbot.id,
                    content: chunk,
                    embedding
                };
            }));

            console.log(`[UPLOAD:${reqId}] Embeddings generated. Inserting into DB...`);

            const { error: chunkError } = await supabase
                .from('document_chunks')
                .insert(chunkData);

            if (chunkError) {
                console.error(`[UPLOAD:${reqId}] Chunk insertion failed:`, chunkError);
                throw chunkError;
            }
            console.log(`[UPLOAD:${reqId}] Successfully stored chunks for ${file.originalname}`);
        }

        console.log(`[UPLOAD:${reqId}] Completed successfully.`);
        res.json({ message: 'Chatbot created successfully', chatbot_id: chatbot.id });

    } catch (error: any) {
        console.error(`[UPLOAD:${reqId}] Critical Error:`, error.message);
        res.status(500).json({ error: error.message });
    }
});

// 2. Chat Endpoint
app.post('/chat/:chatbot_id', async (req, res) => {
    const reqId = Date.now().toString().slice(-6);
    try {
        const { chatbot_id } = req.params;
        const { message, session_id, history: clientHistory } = req.body;
        console.log(`[CHAT:${reqId}] Incoming message for bot ${chatbot_id}. Session: ${session_id}`);
        console.log(`[CHAT:${reqId}] Message: "${message.substring(0, 50)}..."`);

        // 1. Fetch relevant chunks (RAG)
        console.log(`[CHAT:${reqId}] Retrieving RAG chunks...`);
        const chunks = await RAGService.retrieveRelevantChunks(message, chatbot_id);
        console.log(`[CHAT:${reqId}] Found ${chunks.length} relevant chunks`);
        const context = chunks.map((c: any) => c.content).join('\n\n');

        // 2. Get Chatbot Info for system instruction
        const { data: chatbot } = await supabase
            .from('chatbots')
            .select('name, welcome_message')
            .eq('id', chatbot_id)
            .single();

        // 0. Ensure chat session exists (fixes FK constraint error)
        if (session_id) {
            // console.log(`[CHAT:${reqId}] Upserting session ${session_id}`);
            await supabase
                .from('chat_sessions')
                .upsert({ id: session_id, chatbot_id: chatbot_id }, { onConflict: 'id' });
        }

        // 3. Determine History (Prefer Client History "RAM")
        let history: { role: string, content: string }[] = clientHistory || [];

        if (history.length > 0) {
            console.log(`[CHAT:${reqId}] Using client-side (RAM) history: ${history.length} messages`);
        } else if (session_id) {
            console.log(`[CHAT:${reqId}] Fetching history from DB for session: ${session_id}`);
            const { data: historyData, error: historyError } = await supabase
                .from('chat_messages')
                .select('role, content')
                .eq('session_id', session_id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (historyError) {
                console.error(`[CHAT:${reqId}] History fetch error:`, historyError);
            }

            if (historyData) {
                history = historyData.reverse();
                console.log(`[CHAT:${reqId}] Retrieved ${history.length} messages from DB`);
            }
        } else {
            console.log(`[CHAT:${reqId}] No history context.`);
        }
        const systemInstruction = `You are ${chatbot?.name || 'an AI assistant'}. Your purpose is to answer questions based on the provided documents and the current conversation.`;

        // 4. Generate response with Memory & Persona
        console.log(`[CHAT:${reqId}] Sending to LLM...`);
        const answer = await EmbeddingService.generateChatResponse(systemInstruction, context, message, history);
        console.log(`[CHAT:${reqId}] LLM Response generated (${answer.length} chars)`);

        // 5. Save to history
        if (session_id) {
            const { error: saveError } = await supabase.from('chat_messages').insert([
                { session_id, role: 'user', content: message },
                { session_id, role: 'assistant', content: answer }
            ]);
            if (saveError) {
                console.error(`[CHAT:${reqId}] Error saving history to DB:`, saveError);
            } else {
                console.log(`[CHAT:${reqId}] Turn saved to DB.`);
            }
        }

        res.json({ answer, context_used: chunks.length > 0 });

    } catch (error: any) {
        console.error(`[CHAT:${reqId}] Error:`, error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Embed Configuration Endpoint
app.get('/chatbot/:chatbot_id/embed', async (req, res) => {
    const reqId = Date.now().toString().slice(-6);
    try {
        const { chatbot_id } = req.params;
        console.log(`[CONFIG:${reqId}] Fetching config for ${chatbot_id}`);
        const { data: chatbot, error } = await supabase
            .from('chatbots')
            .select('*')
            .eq('id', chatbot_id)
            .single();

        if (error) throw error;
        res.json(chatbot);
    } catch (error: any) {
        console.error(`[CONFIG:${reqId}] Error:`, error.message);
        res.status(404).json({ error: 'Chatbot not found' });
    }
});

// 4. Chatbot UI for Embeds
app.get('/chatbot/:chatbot_id/ui', async (req, res) => {
    const { chatbot_id } = req.params;
    console.log(`[UI_LOAD] Request for UI iframe: ${chatbot_id}`);
    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <style>
                    body { margin: 0; font-family: sans-serif; height: 100vh; display: flex; flex-direction: column; }
                    iframe { border: none; flex: 1; width: 100%; }
                </style>
            </head>
            <body>
                <iframe src="http://localhost:5173/chatbot/${chatbot_id}"></iframe>
            </body>
        </html>
    `);
});

// 5. TTS Proxy Endpoint
app.post('/generate-speech', async (req, res) => {
    const requestId = Date.now().toString().slice(-6);
    console.log(`[TTS:${requestId}] Received request`);

    try {
        const { text, voice = 'Brian' } = req.body;
        if (!text) {
            console.error(`[TTS:${requestId}] Error: Missing text`);
            return res.status(400).json({ error: 'Text is required' });
        }

        console.log(`[TTS:${requestId}] Text length: ${text.length} chars. Voice: ${voice}`);
        const encodedText = encodeURIComponent(text);
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };

        // 1. Primary: Google Translate Unofficial (More Reliable)
        try {
            console.log(`[TTS:${requestId}] Attempting Primary: Google TTS`);
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`;
            const response = await fetch(url, { headers });

            if (!response.ok) {
                throw new Error(`Google TTS failed with ${response.status} ${response.statusText}`);
            }

            console.log(`[TTS:${requestId}] Google TTS Success`);
            const arrayBuffer = await response.arrayBuffer();
            res.set('Content-Type', 'audio/mpeg');
            return res.send(Buffer.from(arrayBuffer));
        } catch (e: any) {
            console.warn(`[TTS:${requestId}] Google TTS warning: ${e.message}. Switching to fallback.`);
        }

        // 2. Fallback: StreamElements (High Quality but often blocks bots)
        try {
            console.log(`[TTS:${requestId}] Attempting Fallback: StreamElements`);
            const url = `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encodedText}`;
            const response = await fetch(url, { headers });

            if (!response.ok) {
                throw new Error(`StreamElements failed with ${response.status} ${response.statusText}`);
            }

            console.log(`[TTS:${requestId}] StreamElements Success`);
            const arrayBuffer = await response.arrayBuffer();
            res.set('Content-Type', 'audio/mpeg');
            return res.send(Buffer.from(arrayBuffer));
        } catch (e: any) {
            console.error(`[TTS:${requestId}] All providers failed:`, e.message);
            throw e;
        }

    } catch (error: any) {
        console.error(`[TTS:${requestId}] Critical Error:`, error.message);
        res.status(500).json({ error: 'Failed to generate speech' });
    }
});

app.listen(port, () => {
    console.log(`Chatbot Maker Backend running on http://localhost:${port}`);
});
