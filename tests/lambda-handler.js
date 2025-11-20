const { handler } = require('../src/lambda/handler');

// Test cases
const testCases = [
    { number: 5, expected: 15 },
    { number: -3, expected: -9 },
    { number: 0, expected: 0 },
    { number: 7.5, expected: 22.5 },
    { number: "invalid", expected: "error" },
    { expected: "error" } // missing number field
];

async function runTests() {
    console.log('Running local tests...\n');

    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const event = {
            body: JSON.stringify(testCase)
        };

        try {
            const response = await handler(event);
            const body = JSON.parse(response.body);

            console.log(`Test ${i + 1}:`);
            console.log(`  Input: ${JSON.stringify(testCase)}`);
            console.log(`  Status: ${response.statusCode}`);
            console.log(`  Response: ${JSON.stringify(body)}`);

            // Validate result
            if (testCase.expected === "error") {
                if (response.statusCode !== 200) {
                    console.log('  ✓ PASS (error handled correctly)\n');
                } else {
                    console.log('  ✗ FAIL (expected error)\n');
                }
            } else if (body.result === testCase.expected) {
                console.log('  ✓ PASS\n');
            } else {
                console.log(`  ✗ FAIL (expected ${testCase.expected}, got ${body.result})\n`);
            }

        } catch (error) {
            console.log(`Test ${i + 1}:`);
            console.log(`  ✗ ERROR: ${error.message}\n`);
        }
    }
}

runTests();
