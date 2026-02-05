const https = require('https');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models?key=${API_KEY}`,
    method: 'GET'
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const json = JSON.parse(data);
        if (json.error) {
            console.error('Error:', json.error.message);
        } else {
            console.log('--- TARGET MATCHES ---');
            json.models
                .filter(m => m.name.toLowerCase().includes('lite') || m.name.toLowerCase().includes('2.0'))
                .forEach(m => console.log(`MATCH: ${m.name}`));
            console.log('-------------------------');
        }
    });
});

req.on('error', (error) => { console.error(error); });
req.end();
