const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkChunks() {
    console.log('Checking for recent chatbots and their chunks...');
    try {
        const { data: chatbots, error: cbError } = await supabase
            .from('chatbots')
            .select('id, name')
            .order('created_at', { ascending: false })
            .limit(5);

        if (cbError) throw cbError;

        for (const bot of chatbots) {
            const { count, error: countError } = await supabase
                .from('document_chunks')
                .select('*', { count: 'exact', head: true })
                .eq('chatbot_id', bot.id);

            console.log(`Chatbot: ${bot.name} (ID: ${bot.id}) - Chunk Count: ${count}`);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkChunks();
