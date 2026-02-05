import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- Testing Chatbot Insert with string owner_id ---');
    const { data, error } = await supabase.from('chatbots').insert({
        name: 'Test Chatbot',
        owner_id: 'demo-user'
    }).select();

    if (error) {
        console.log('Insert failed:', error.message);
        if (error.details) console.log('Details:', error.details);
    } else {
        console.log('Success with string owner_id!');
    }
}
diagnose();
