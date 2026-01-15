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
    try {
        const { chatbot_name, owner_id: rawOwnerId } = req.body;
        const owner_id = getEffectiveOwnerId(rawOwnerId);
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Create Chatbot
        const { data: chatbot, error: cbError } = await supabase
            .from('chatbots')
            .insert({
                name: chatbot_name,
                owner_id
            })
            .select()
            .single();

        if (cbError) {
            console.error('Chatbot creation error:', cbError);
            throw cbError;
        }

        for (const file of files) {
            console.log(`Processing file: ${file.originalname}`);
            // Extract & Chunk
            const text = await PDFProcessor.extractText(file.buffer);
            console.log(`Extracted text length: ${text?.length || 0}`);

            const chunks = PDFProcessor.chunkText(text);
            console.log(`Generated ${chunks.length} chunks`);

            // Create Document record
            const { data: doc, error: docError } = await supabase
                .from('documents')
                .insert({ chatbot_id: chatbot.id, owner_id, filename: file.originalname })
                .select()
                .single();

            if (docError) {
                console.error('Document record error:', docError);
                throw docError;
            }

            console.log(`Created document record with ID: ${doc.id}`);

            // Generate Embeddings and Save Chunks
            const chunkData = await Promise.all(chunks.map(async (chunk, index) => {
                const embedding = await EmbeddingService.generateEmbedding(chunk);
                return {
                    document_id: doc.id,
                    chatbot_id: chatbot.id,
                    content: chunk,
                    embedding
                };
            }));

            console.log(`Generated embeddings for ${chunkData.length} chunks`);

            const { error: chunkError } = await supabase
                .from('document_chunks')
                .insert(chunkData);

            if (chunkError) {
                console.error('Chunk insertion error:', chunkError);
                throw chunkError;
            }
            console.log(`Successfully stored ${chunkData.length} chunks for ${file.originalname}`);
        }

        res.json({ message: 'Chatbot created successfully', chatbot_id: chatbot.id });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Chat Endpoint
app.post('/chat/:chatbot_id', async (req, res) => {
    try {
        const { chatbot_id } = req.params;
        const { message, session_id, history: clientHistory } = req.body;
        console.log(`--- CHAT_REQUEST_START ---`);
        console.log(`Session ID: ${session_id || 'NONE'}`);

        // 1. Fetch relevant chunks (RAG)
        const chunks = await RAGService.retrieveRelevantChunks(message, chatbot_id);
        const context = chunks.map((c: any) => c.content).join('\n\n');

        // 2. Get Chatbot Info for system instruction
        const { data: chatbot } = await supabase
            .from('chatbots')
            .select('name, welcome_message')
            .eq('id', chatbot_id)
            .single();

        // 0. Ensure chat session exists (fixes FK constraint error)
        if (session_id) {
            console.log(`Ensuring session exists: ${session_id}`);
            await supabase
                .from('chat_sessions')
                .upsert({ id: session_id, chatbot_id: chatbot_id }, { onConflict: 'id' });
        }

        // 3. Determine History (Prefer Client History "RAM")
        let history: { role: string, content: string }[] = clientHistory || [];

        if (history.length > 0) {
            console.log(`Using client-side (RAM) history: ${history.length} messages`);
        } else if (session_id) {
            console.log(`Fetching history from DB for session: ${session_id}`);
            const { data: historyData, error: historyError } = await supabase
                .from('chat_messages')
                .select('role, content')
                .eq('session_id', session_id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (historyError) {
                console.error('History fetch error:', historyError);
            }

            if (historyData) {
                history = historyData.reverse();
                console.log(`Retrieved ${history.length} messages from DB`);
            }
        } else {
            console.log('No history provided and no session_id.');
        }
        const systemInstruction = `You are ${chatbot?.name || 'an AI assistant'}. Your purpose is to answer questions based on the provided documents and the current conversation.`;

        // 4. Generate response with Memory & Persona
        const answer = await EmbeddingService.generateChatResponse(systemInstruction, context, message, history);

        // 5. Save to history
        if (session_id) {
            const { error: saveError } = await supabase.from('chat_messages').insert([
                { session_id, role: 'user', content: message },
                { session_id, role: 'assistant', content: answer }
            ]);
            if (saveError) {
                console.error('Error saving history:', saveError);
            } else {
                console.log('Successfully saved current turn to history');
            }
        }

        res.json({ answer, context_used: chunks.length > 0 });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Embed Configuration Endpoint
app.get('/chatbot/:chatbot_id/embed', async (req, res) => {
    try {
        const { chatbot_id } = req.params;
        const { data: chatbot, error } = await supabase
            .from('chatbots')
            .select('*')
            .eq('id', chatbot_id)
            .single();

        if (error) throw error;
        res.json(chatbot);
    } catch (error: any) {
        res.status(404).json({ error: 'Chatbot not found' });
    }
});

// 4. Chatbot UI for Embeds
app.get('/chatbot/:chatbot_id/ui', async (req, res) => {
    const { chatbot_id } = req.params;
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

app.listen(port, () => {
    console.log(`Chatbot Maker Backend running on http://localhost:${port}`);
});
