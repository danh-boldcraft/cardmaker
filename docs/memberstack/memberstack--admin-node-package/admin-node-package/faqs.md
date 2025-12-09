[ Memberstack Developers Documentation](/)

[](/)

Admin Node Package

  * [Quick Start](/admin-node-package/quick-start)

  * [Member Actions](/admin-node-package/member-actions)

  * [Verification](/admin-node-package/verification)

  * [Common Use Cases](/admin-node-package/common-use-cases)

  * [FAQs](/admin-node-package/faqs)




# Frequently Asked Questions

This section addresses common questions and challenges when working with the Memberstack Admin Package. Find answers to technical questions, implementation strategies, and best practices.

### When should I use the Admin Package vs. the DOM Package?

The Admin and DOM packages serve different purposes and are used in different environments:

#### Admin Package

  * Server-side operations (Node.js)
  * Member management via your backend
  * Webhook processing
  * Token verification
  * Security-sensitive operations



#### DOM Package

  * Client-side operations (browser)
  * Authentication UI
  * User registration and login
  * Profile management
  * Payment processing



In a typical implementation, you would use both packages together: the DOM Package for client-side interactions and the Admin Package for server-side operations and security.

### What kind of rate limits does the Admin API have?

The Memberstack Admin API has a rate limit of 25 requests per second. If you exceed this limit, you'll receive a 429 (Too Many Requests) error.

#### Rate Limit Handling

For applications that need to process large numbers of members or handle high-traffic scenarios, implement these strategies:

  * Add delays between API calls in bulk operations
  * Implement exponential backoff for retry logic
  * Use batching for large datasets
  * Cache frequently accessed data
  * Distribute operations over time when possible



Here's an example of implementing exponential backoff for API calls:

/**

* Retry a function with exponential backoff

* @param {Function} fn - The function to retry

* @param {number} maxRetries - Maximum number of retries

* @param {number} baseDelay - Base delay in milliseconds

* @returns {Promise<any>} - The function result

*/

async function retryWithBackoff(fn, maxRetries = 5, baseDelay = 300) {

let retries = 0;

while (true) {

try {

return await fn();

} catch (error) {

retries++;

// If we've reached max retries or error isn't rate limiting, throw

if (retries >= maxRetries || error.status !== 429) {

throw error;

}

// Calculate exponential backoff delay

const delay = baseDelay * Math.pow(2, retries);

// Add some jitter to prevent synchronized retries

const jitter = Math.random() * 100;

console.log(`Rate limited. Retrying in ${delay + jitter}ms (attempt ${retries})`);

// Wait before retrying

await new Promise(resolve => setTimeout(resolve, delay + jitter));

}

}

}

// Usage example

async function getMemberWithRetry(memberId) {

return retryWithBackoff(async () => {

return await memberstack.members.retrieve({ id: memberId });

});

}

### How do I migrate from REST API calls to the Admin Package?

If you're currently using direct REST API calls with fetch or axios, migrating to the Admin Package is straightforward. The Admin Package methods map closely to REST endpoints but provide better error handling, typed responses, and a more consistent developer experience.

#### REST API (Before)

// Using fetch to call the REST API directly

async function getMember(memberId) {

try {

const response = await fetch(`https://api.memberstack.com/v1/members/${memberId}`, {

method: 'GET',

headers: {

'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,

'Content-Type': 'application/json'

}

});

if (!response.ok) {

throw new Error(`API error: ${response.status}`);

}

return await response.json();

} catch (error) {

console.error('Error fetching member:', error);

throw error;

}

}

#### Admin Package (After)

// Using the Admin Package

const memberstackAdmin = require('@memberstack/admin');

const memberstack = memberstackAdmin.init(process.env.MEMBERSTACK_SECRET_KEY);

async function getMember(memberId) {

try {

const result = await memberstack.members.retrieve({

id: memberId

});

return result.data;

} catch (error) {

console.error('Error fetching member:', error.message);

throw error;

}

}

The Admin Package provides several benefits over direct REST API calls:

  * Consistent API interface with proper typings (if using TypeScript)
  * Automatic error handling and parsing
  * Simplified authentication (no need to manage auth headers)
  * Helper methods for common operations like webhook verification
  * Better developer experience with IDE autocomplete



### Is the Admin Package secure for serverless functions?

Yes, the Admin Package is designed to work in any Node.js environment, including serverless functions like AWS Lambda, Vercel Serverless Functions, or Netlify Functions.

#### Serverless Considerations

  * Initialize the Memberstack client outside your handler function to take advantage of container reuse
  * Be mindful of cold starts - the initial initialization may add some latency to the first request
  * Store your secret key in environment variables or secrets management appropriate for your serverless platform
  * Consider connection pooling for database operations if you're using them



Example of a properly structured AWS Lambda function using the Admin Package:

// Initialize Memberstack outside the handler

const memberstackAdmin = require('@memberstack/admin');

const memberstack = memberstackAdmin.init(process.env.MEMBERSTACK_SECRET_KEY);

// AWS Lambda handler

exports.handler = async (event) => {

try {

// Parse the request

const memberId = event.pathParameters?.memberId;

if (!memberId) {

return {

statusCode: 400,

body: JSON.stringify({ error: 'Member ID is required' })

};

}

// Get member details

const result = await memberstack.members.retrieve({

id: memberId

});

// Return success response

return {

statusCode: 200,

body: JSON.stringify(result.data)

};

} catch (error) {

console.error('Error:', error);

// Return error response

return {

statusCode: error.status || 500,

body: JSON.stringify({ error: error.message || 'Internal server error' })

};

}

};

### How do I handle errors from the Admin Package?

The Admin Package throws standardized error objects that include helpful information about what went wrong. Here's how to properly handle these errors:

try {

// Attempt to get a member that doesn't exist

const result = await memberstack.members.retrieve({

id: "non_existent_id"

});

} catch (error) {

// The error object contains useful information

console.error(`Error status: ${error.status}`); // HTTP status code (e.g., 404)

console.error(`Error message: ${error.message}`); // Human-readable message

console.error(`Error code: ${error.code}`); // Error code identifier

// Handle specific error types

if (error.status === 404) {

console.log("Member not found");

} else if (error.status === 401) {

console.log("Authentication issue with your secret key");

} else if (error.status === 429) {

console.log("Rate limit exceeded");

} else {

console.log("Other error:", error);

}

}

#### Common Error Status Codes

  * **400** \- Bad request (invalid parameters or data)
  * **401** \- Unauthorized (invalid or expired API key)
  * **404** \- Not found (resource doesn't exist)
  * **422** \- Validation error (invalid data format)
  * **429** \- Too many requests (rate limit exceeded)
  * **500** \- Internal server error (something went wrong on the server)



💡 **Tip:**

Error Handling Best Practices:

  * Always wrap API calls in try/catch blocks
  * Check error.status to determine the type of error
  * Log detailed error information for debugging
  * Provide user-friendly error messages in your application
  * Implement retry logic for transient errors (e.g., rate limits)



### How do I test my Admin Package integration?

Memberstack provides a sandbox environment for testing your integration without affecting production data. The sandbox environment works exactly like the live environment but uses test credentials.

#### Test Mode Keys

  * Sandbox secret keys start with `sk_sb_`
  * Found in your Memberstack dashboard under Test Mode
  * Limited to 50 test members
  * Can be used for development and testing



#### Live Mode Keys

  * Production secret keys start with `sk_`
  * For use in production environments only
  * No member limits
  * Affects real customer data



Testing approach using environment variables:

// .env.development

MEMBERSTACK_SECRET_KEY=sk_sb_your_test_key

MEMBERSTACK_APP_ID=app_sb_your_test_app_id

// .env.production

MEMBERSTACK_SECRET_KEY=sk_your_live_key

MEMBERSTACK_APP_ID=app_your_live_app_id

// Load the appropriate environment variables

const memberstackAdmin = require('@memberstack/admin');

const memberstack = memberstackAdmin.init(process.env.MEMBERSTACK_SECRET_KEY);

⚠️ **Important:**

Important Testing Notes:

  * Never use test mode data or keys in production environments
  * Test data and live data are completely separate
  * Create a complete testing plan that covers authentication, member operations, and webhooks
  * Use unique email addresses for test members to avoid conflicts



## Need Help?

Can't find the answer you're looking for? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
