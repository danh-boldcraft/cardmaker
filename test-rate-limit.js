// Test script to verify rate limiting is working
// This will send multiple rapid requests to trigger the rate limit

const API_ENDPOINT = 'https://usyl5zha62.execute-api.us-west-2.amazonaws.com/prod/multiply';
const NUM_REQUESTS = 25; // Send 25 requests (should trigger limit of 10/sec)

async function testRateLimit() {
    console.log(`🧪 Testing rate limiting by sending ${NUM_REQUESTS} rapid requests...\n`);

    const results = {
        successful: 0,
        rateLimited: 0,
        errors: 0
    };

    const promises = [];

    // Send all requests at once
    for (let i = 1; i <= NUM_REQUESTS; i++) {
        const promise = fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ number: i })
        })
        .then(async response => {
            if (response.status === 200) {
                const data = await response.json();
                console.log(`✅ Request ${i}: Success - ${data.input} × 3 = ${data.result}`);
                results.successful++;
            } else if (response.status === 429) {
                console.log(`⏱️  Request ${i}: Rate limited (429 Too Many Requests)`);
                results.rateLimited++;
            } else {
                console.log(`❌ Request ${i}: Error - Status ${response.status}`);
                results.errors++;
            }
        })
        .catch(error => {
            console.log(`❌ Request ${i}: Network error - ${error.message}`);
            results.errors++;
        });

        promises.push(promise);
    }

    // Wait for all requests to complete
    await Promise.all(promises);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 RATE LIMITING TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Successful requests: ${results.successful}`);
    console.log(`⏱️  Rate limited (429): ${results.rateLimited}`);
    console.log(`❌ Errors:              ${results.errors}`);
    console.log('='.repeat(60));

    if (results.rateLimited > 0) {
        console.log('\n✅ SUCCESS: Rate limiting is working correctly!');
        console.log(`   Limit: 10 requests/second with burst of 20`);
        console.log(`   ${results.rateLimited} requests were throttled as expected.`);
    } else {
        console.log('\n⚠️  WARNING: No requests were rate limited.');
        console.log('   You may need to send more requests or check the configuration.');
    }
}

// Run the test
testRateLimit().catch(console.error);
