const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking document_chunks schema...');
    try {
        const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'document_chunks' });
        // If get_table_columns doesn't exist, we'll try a select limit 1
        const { data: sample, error: selectError } = await supabase
            .from('document_chunks')
            .select('*')
            .limit(1);

        if (selectError) {
            console.error('Select Error:', selectError.message);
        } else {
            console.log('Sample data keys:', Object.keys(sample[0] || {}));
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkSchema();
