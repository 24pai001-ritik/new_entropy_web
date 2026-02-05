const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRPC() {
    console.log('Checking match_document_chunks RPC...');
    try {
        // We can check if calling with some dummy data works or fails with "function not found"
        // Or query information_schema if we have access via RPC or similar
        // Let's try a dummy call first
        const { error } = await supabase.rpc('match_document_chunks', {
            query_embedding: new Array(768).fill(0),
            match_threshold: 0.5,
            match_count: 1,
            filter_chatbot_id: '00000000-0000-0000-0000-000000000000'
        });

        if (error) {
            console.log('RPC Error:', error.message);
            if (error.message.includes('not found') || error.message.includes('does not exist')) {
                console.log('CRITICAL: match_document_chunks function is MISSING in Supabase.');
            }
        } else {
            console.log('RPC exists and responded.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkRPC();
