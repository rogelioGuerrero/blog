import fetch from 'node-fetch';

const API_KEY = '8ca958f2043b40b9a5dacf89fa6d4daa';

async function testNewsAPI() {
    const query = 'tendencia del euro';
    const now = new Date();
    const fromDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 24h ago
    const fromISO = fromDate.toISOString().split('T')[0];

    console.log(`--- Testing /everything endpoint ---`);
    const everythingUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${fromISO}&sortBy=popularity&language=es&pageSize=5&apiKey=${API_KEY}`;
    
    try {
        const res = await fetch(everythingUrl);
        const data = await res.json();
        console.log(`Status: ${data.status}`);
        if (data.status === 'ok') {
            console.log(`Total Results: ${data.totalResults}`);
            data.articles.slice(0, 2).forEach((a, i) => {
                console.log(`[${i+1}] ${a.title} (${a.source.name})`);
            });
        } else {
            console.error('Error:', data.message);
        }
    } catch (e) {
        console.error('Fetch failed:', e);
    }

    console.log(`\n--- Testing /top-headlines endpoint (Category: business) ---`);
    // 'business' category is relevant for "tendencia del euro"
    const headlinesUrl = `https://newsapi.org/v2/top-headlines?category=business&language=es&pageSize=5&apiKey=${API_KEY}`;
    
    try {
        const res = await fetch(headlinesUrl);
        const data = await res.json();
        console.log(`Status: ${data.status}`);
        if (data.status === 'ok') {
            console.log(`Total Results: ${data.totalResults}`);
            data.articles.slice(0, 2).forEach((a, i) => {
                console.log(`[${i+1}] ${a.title} (${a.source.name})`);
            });
        } else {
            console.error('Error:', data.message);
        }
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

testNewsAPI();
