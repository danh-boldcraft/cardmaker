[ Memberstack Developers Documentation](/)

[](/)

Admin Rest API

  * [Quick Start](/admin-rest-api/quick-start)

  * [Member Actions](/admin-rest-api/member-actions)

  * [Data Tables](/admin-rest-api/data-tables)

  * [Verification](/admin-rest-api/verification)

  * [Common Use Cases](/admin-rest-api/common-use-cases)

  * [FAQs](/admin-rest-api/faqs)




# Frequently Asked Questions

This section addresses common questions and challenges when working with the Memberstack Admin REST API. Find answers to technical questions, implementation strategies, and best practices.

### When should I use the Admin REST API vs. the Node.js Admin package?

Both the Admin REST API and the Node.js Admin package provide similar functionality, but they are designed for different use cases:

#### Admin REST API

  * Direct HTTP API calls
  * Language-agnostic (can be used with any programming language)
  * More control over requests
  * Better for custom implementations
  * Works in any server-side environment



#### Node.js Admin Package

  * JavaScript/TypeScript only
  * Simpler implementation
  * Built-in error handling
  * Type definitions (if using TypeScript)
  * More abstracted implementation



Choose the Admin REST API if you're not using Node.js, need more control over your API calls, or want to implement your own client library. Use the Node.js Admin package for simpler, faster implementation in Node.js environments.

### What are the rate limits for the Admin REST API?

The Memberstack Admin REST API has a rate limit of 25 requests per second. If you exceed this limit, you'll receive a 429 (Too Many Requests) error response.

#### Rate Limit Best Practices

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

if (retries >= maxRetries || error.response?.status !== 429) {

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

const response = await axios.get(

`https://admin.memberstack.com/members/${memberId}`,

{ headers: { 'X-API-KEY': process.env.MEMBERSTACK_SECRET_KEY } }

);

return response.data;

});

}

### How do I handle errors from the Admin REST API?

The Admin REST API returns standardized error responses with HTTP status codes that indicate what went wrong. Here's how to properly handle these errors:

try {

// Make API request

const response = await axios.get(

'https://admin.memberstack.com/members/non_existent_id',

{ headers: { 'X-API-KEY': 'your_secret_key' } }

);

// Process successful response

const member = response.data;

} catch (error) {

// Check for Axios error object

if (error.response) {

// The server responded with an error status

const status = error.response.status;

const errorMessage = error.response.data.error || 'Unknown error';

switch (status) {

case 400:

console.error('Bad request:', errorMessage);

// Handle invalid input

break;

case 401:

console.error('Authentication failed:', errorMessage);

// Handle invalid API key

break;

case 404:

console.error('Resource not found:', errorMessage);

// Handle missing resource

break;

case 429:

console.error('Rate limit exceeded:', errorMessage);

// Handle rate limiting (implement backoff/retry)

break;

default:

console.error(`Server error (${status}):`, errorMessage);

// Handle unexpected errors

}

} else if (error.request) {

// The request was made but no response was received

console.error('No response received:', error.request);

// Handle network issues, timeouts

} else {

// Something else caused the error

console.error('Request error:', error.message);

// Handle other errors

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
  * Check error status codes to determine the type of error
  * Log detailed error information for debugging
  * Provide user-friendly error messages in your application
  * Implement retry logic for transient errors (e.g., rate limits)



### Can I use the Admin REST API from the client-side?

⚠️ **Important:**

**No, you should never use the Admin REST API directly from client-side code.** Your secret key provides full administrative access to your Memberstack account and must be kept secure.

The correct approach is to create your own server-side endpoints that use the Admin REST API internally, and then call those endpoints from your client-side code. This allows you to:

  * Keep your secret key secure on your server
  * Implement proper authentication and authorization
  * Add additional validation and error handling
  * Cache frequently accessed data to improve performance



#### Example architecture:

  1. **Client-side code** calls your own secure API endpoints
  2. **Your server** validates requests and checks authentication
  3. **Your server** makes requests to Memberstack Admin REST API with your secret key
  4. **Your server** processes the response and returns appropriate data to the client



#### Alternative for Client-Side

For client-side functionality, use the [Memberstack DOM Package](/dom-package/quick-start) instead. It's specifically designed for browser environments and uses the public key, which is safe to include in client-side code.

### How do I test my Admin REST API integration?

Memberstack provides a sandbox environment for testing your integration without affecting your live data. Here's how to use it effectively:

#### Test Mode

  * Secret keys start with `sk_sb_`
  * Found in your Memberstack dashboard under Test Mode
  * Limited to 50 test members
  * Can be used for development and testing



#### Live Mode

  * Secret keys start with `sk_`
  * For use in production environments only
  * No member limits
  * Affects real customer data



#### Testing approach using environment variables:

// .env.development

MEMBERSTACK_SECRET_KEY=sk_sb_your_test_key

MEMBERSTACK_APP_ID=app_sb_your_test_app_id

// .env.production

MEMBERSTACK_SECRET_KEY=sk_your_live_key

MEMBERSTACK_APP_ID=app_your_live_app_id

// Configure your API client based on environment

const apiKey = process.env.MEMBERSTACK_SECRET_KEY;

const baseURL = 'https://admin.memberstack.com';

// Make API requests with the appropriate key

const headers = {

'X-API-KEY': apiKey,

'Content-Type': 'application/json'

};

⚠️ **Important:**

Important Testing Notes:

  * Never use test mode data or keys in production environments
  * Test data and live data are completely separate
  * Create a complete testing plan that covers member operations and token verification
  * Use unique email addresses for test members to avoid conflicts
  * Regularly clean up test members to stay under the 50-member limit



### Can I migrate from direct REST API calls to the Node.js Admin package?

Yes, you can migrate from direct REST API calls to the Node.js Admin package. The Admin package methods map closely to REST endpoints but provide better error handling, typed responses, and a more consistent developer experience.

#### REST API (Before)

// Using Axios to call the REST API directly

async function getMember(memberId) {

try {

const response = await axios.get(

`https://admin.memberstack.com/members/${memberId}`,

{

headers: {

'X-API-KEY': process.env.MEMBERSTACK_SECRET_KEY

}

}

);

return response.data;

} catch (error) {

console.error('Error fetching member:', error);

throw error;

}

}

#### Admin Package (After)

// Using the Node.js Admin Package

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

The Node.js Admin package provides several benefits over direct REST API calls:

  * Consistent API interface with proper typings (if using TypeScript)
  * Automatic error handling and parsing
  * Simplified authentication (no need to manage auth headers)
  * Helper methods for common operations
  * Better developer experience with IDE autocomplete



### Is the Admin REST API secure for serverless functions?

Yes, the Admin REST API can be used securely in serverless functions, but there are important considerations to keep in mind:

#### Serverless Security Considerations

  * Store your secret key in environment variables or secrets management provided by your serverless platform
  * Be mindful of cold starts - the initial request might be slower
  * Consider connection reuse when possible to improve performance
  * Implement proper timeouts to avoid function execution limits
  * Be careful with memory usage and potential leaks in long-running operations



Example of a properly structured AWS Lambda function:

// Initialize axios outside the handler

const axios = require('axios');

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com';

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

const response = await axios.get(

`${BASE_URL}/members/${memberId}`,

{ headers: { 'X-API-KEY': API_KEY } }

);

// Return success response

return {

statusCode: 200,

body: JSON.stringify(response.data)

};

} catch (error) {

console.error('Error:', error);

// Return error response

return {

statusCode: error.response?.status || 500,

body: JSON.stringify({

error: error.response?.data?.error || 'Internal server error'

})

};

}

};

### Can I verify webhook signatures with the REST API?

No, webhook signature verification is not currently supported through the REST API. To verify webhook signatures, you must use the Node.js Admin Package instead.

If your backend is not built with Node.js and you need to verify webhooks, consider creating a small Node.js microservice to handle webhook verification, or reach out to Memberstack support for guidance on alternative approaches.

## Need More Help?

Can't find the answer you're looking for? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
