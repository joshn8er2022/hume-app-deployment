// Simple script to test Railway deployment URL
console.log('=== Railway URL Test ===');

const https = require('https');
const http = require('http');

// Common Railway URL patterns
const possibleUrls = [
    'https://hume-app-humejurn-production.up.railway.app',
    'https://hume-app-humejurn-production-up.railway.app',
    'https://hume-app-humejurn.up.railway.app',
    'https://hume-app-humejurn.railway.app',
    'https://humejurn-production.up.railway.app',
    'https://humejurn.up.railway.app',
    // Add more patterns as needed
];

async function testUrl(url) {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const testUrl = `${url}/health`;
        
        console.log(`Testing: ${testUrl}`);
        
        const req = client.get(testUrl, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`✅ ${testUrl} - Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        console.log('   Response:', response);
                        resolve({ url, success: true, status: res.statusCode, data: response });
                    } catch (e) {
                        resolve({ url, success: true, status: res.statusCode, data: data });
                    }
                } else {
                    resolve({ url, success: false, status: res.statusCode, error: data });
                }
            });
        });
        
        req.on('error', (err) => {
            console.log(`❌ ${testUrl} - Error: ${err.message}`);
            resolve({ url, success: false, error: err.message });
        });
        
        req.setTimeout(10000, () => {
            console.log(`⏰ ${testUrl} - Timeout`);
            req.destroy();
            resolve({ url, success: false, error: 'Timeout' });
        });
    });
}

async function testAllUrls() {
    console.log('Testing possible Railway URLs...\n');
    
    const results = [];
    
    for (const url of possibleUrls) {
        const result = await testUrl(url);
        results.push(result);
        console.log(''); // Empty line for readability
    }
    
    console.log('=== RESULTS SUMMARY ===');
    const working = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    if (working.length > 0) {
        console.log('\n✅ WORKING URLs:');
        working.forEach(r => {
            console.log(`  - ${r.url} (Status: ${r.status})`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n❌ FAILED URLs:');
        failed.forEach(r => {
            console.log(`  - ${r.url} (${r.error || 'Failed'})`);
        });
    }
    
    if (working.length === 0) {
        console.log('\n⚠️  NO WORKING URLs FOUND');
        console.log('This suggests:');
        console.log('  1. Railway deployment is not accessible');
        console.log('  2. URL pattern is different than expected');
        console.log('  3. Server is not responding to health checks');
        console.log('  4. Network connectivity issues');
    }
}

// Run the test
testAllUrls().catch(console.error);