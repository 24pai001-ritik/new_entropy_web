const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectFunctions() {
    console.log('Inspecting functions in public schema...');
    try {
        const { data, error } = await supabase.rpc('get_functions', { schema_name: 'public' });

        if (error) {
            console.log('RPC get_functions failed (expected if not defined). Trying raw query...');
            // Fallback: use a select on a system table if possible, or just try to call it again with different types
        }

        // Use standard SQL via anonymized RPC or similar? No, let's just try to call it with explicit parameter order.
        console.log('Attempting to call match_document_chunks with positional-style arguments...');
        const { data: result, error: callError } = await supabase.rpc('match_document_chunks', {
            filter_chatbot_id: '00000000-0000-0000-0000-000000000000',
            match_count: 1,
            match_threshold: 0.1,
            query_embedding: new Array(768).fill(0)
        });

        if (callError) {
            console.error('Call Error:', callError.message);
            console.error('Details:', callError.details);
        } else {
            console.log('Success! Function is found and working.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

inspectFunctions();
