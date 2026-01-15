import { createClient } from '@supabase/supabase-js';
import { EmbeddingService } from './embedding-service';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

export class RAGService {
    static async retrieveRelevantChunks(query: string, chatbotId: string, topK: number = 5) {
        // 1. Generate embedding for the query
        const queryEmbedding = await EmbeddingService.generateEmbedding(query);
        console.log(`Query embedding length: ${queryEmbedding.length}`);

        // 2. Search in Supabase using vector similarity
        console.log(`Calling match_document_chunks with: count=${topK}, threshold=0.1, botId=${chatbotId}`);
        const { data, error } = await supabase.rpc('match_document_chunks', {
            query_embedding: queryEmbedding,
            match_threshold: 0.1, // Lower threshold for testing
            match_count: topK,
            filter_chatbot_id: chatbotId
        });

        if (error) {
            console.error('Error fetching chunks:', error);
            return [];
        }

        console.log(`Retrieved ${data?.length || 0} relevant chunks.`);
        return data;
    }
}
