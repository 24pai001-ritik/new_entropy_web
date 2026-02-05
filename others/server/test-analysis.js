const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function testAnalysis() {
    try {
        const response = await fetch('http://localhost:5000/research/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'claims',
                text: 'The paper suggests that LLMs are powerful but prone to hallucinations. We tested this on 100 datasets.'
            })
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testAnalysis();
