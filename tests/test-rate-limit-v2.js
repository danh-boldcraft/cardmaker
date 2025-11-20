// Test script with more detailed error checking
const API_ENDPOINT = 'https://usyl5zha62.execute-api.us-west-2.amazonaws.com/prod/multiply';

async function testSingleBurst() {
    console.log('🧪 Testing rate limiting with a burst of 30 requests...\n');

    const results = {
        successful: 0,
        rateLimited: 0,
        errors: [],
        statusCodes: {}
    };

    const promises = [];

    // Send 30 requests in rapid succession
    for (let i = 1; i <= 30; i++) {
        const promise = fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ number: i })
        })
        .then(async response => {
            const status = response.status;
            results.statusCodes[status] = (results.statusCodes[status] || 0) + 1;

            if (status === 200) {
                const data = await response.json();
                results.successful++;
            } else if (status === 429) {
                const text = await response.text();
                results.rateLimited++;
            } else {
                const text = await response.text();
                results.errors.push({ request: i, status, message: text.substring(0, 200) });
            }
            return { request: i, status };
        })
        .catch(error => {
            results.errors.push({ request: i, error: error.message });
            return { request: i, error: error.message };
        });

        promises.push(promise);
    }

    // Wait for all requests to complete
    const responses = await Promise.all(promises);

    // Sort and display all responses by request number
    console.log('\n' + '='.repeat(70));
    console.log('SORTED RESPONSES:');
    console.log('='.repeat(70));
    responses.sort((a, b) => a.request - b.request).forEach(r => {
        if (r.status === 200) {
            console.log(`Request ${String(r.request).padStart(2, ' ')}: ✅ Success (200)`);
        } else if (r.status === 429) {
            console.log(`Request ${String(r.request).padStart(2, ' ')}: ⏱️  Rate limited (429)`);
        } else if (r.status) {
            console.log(`Request ${String(r.request).padStart(2, ' ')}: ❌ Error (${r.status})`);
        } else {
            console.log(`Request ${String(r.request).padStart(2, ' ')}: ❌ Network error`);
        }
    });

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 RATE LIMITING TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`✅ Successful requests (200):  ${results.successful}`);
    console.log(`⏱️  Rate limited (429):        ${results.rateLimited}`);
    console.log(`❌ Other errors:               ${results.errors.length}`);
    console.log('\nStatus code breakdown:');
    Object.entries(results.statusCodes).sort().forEach(([code, count]) => {
        console.log(`   ${code}: ${count} requests`);
    });
    console.log('='.repeat(70));

    if (results.rateLimited > 0) {
        console.log('\n✅ SUCCESS: Rate limiting is returning 429 errors!');
    } else if (results.errors.length > 0 && results.statusCodes['403']) {
        console.log('\n⚠️  Note: Getting 403 errors, which may indicate rate limiting');
        console.log('   (Some AWS throttling returns 403 instead of 429)');
    } else if (results.errors.length > 0) {
        console.log(`\n⚠️  Getting ${Object.keys(results.statusCodes).filter(c => c !== '200').join(', ')} errors`);
        console.log('   First error details:');
        console.log('   ', results.errors[0]);
    } else {
        console.log('\n⚠️  No throttling detected - may need higher request volume');
    }

    return results;
}

// Run the test
testSingleBurst().catch(console.error);
