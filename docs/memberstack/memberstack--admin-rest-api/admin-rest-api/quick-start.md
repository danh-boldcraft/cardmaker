[ Memberstack Developers Documentation](/)

[](/)

Admin Rest API

  * [Quick Start](/admin-rest-api/quick-start)

    * [Authentication](/admin-rest-api/quick-start#authentication)
    * [Making API Requests](/admin-rest-api/quick-start#making-api-requests)
    * [Security Best Practices](/admin-rest-api/quick-start#security-best-practices)
  * [Member Actions](/admin-rest-api/member-actions)

  * [Data Tables](/admin-rest-api/data-tables)

  * [Verification](/admin-rest-api/verification)

  * [Common Use Cases](/admin-rest-api/common-use-cases)

  * [FAQs](/admin-rest-api/faqs)




# Quick Start

Welcome to the Memberstack Admin REST API! This guide will help you get started with the server-side REST API that allows you to manage members, verify tokens, and perform other administrative tasks programmatically from your server.

### Before You Start

  * Access to your Memberstack secret key (found in your Memberstack dashboard)
  * A server-side environment to make secure API requests
  * For paid functionality, a Memberstack account with an active billing method is required



## Authentication

The Memberstack Admin REST API uses secret keys to authenticate requests. These keys provide full access to your account, so they must be kept secure.

### Secret Key Management

You can view and manage your API keys in the Memberstack dashboard. There are two types of keys:

#### Test Mode Keys

  * Prefix: `sk_sb_`
  * Use for development and testing
  * Limited to 50 test members
  * No real charges processed



#### Live Mode Keys

  * Prefix: `sk_`
  * Use for production environments
  * No member limits
  * Real charges processed



⚠️ **Important:**

**Security Warning:** Your secret keys carry administrative privileges, so keep them secure and use them in server-side environments only! Never use your secret keys in publicly accessible places like:

  * Webflow, WordPress, or other CMS platforms
  * GitHub or other public repositories
  * Client-side code (browser JavaScript)
  * Mobile applications



### Rate Limits

The Memberstack Admin REST API has a rate limit of 25 requests per second. If you exceed this limit, you'll receive a 429 (Too Many Requests) error.

## Making API Requests

Learn how to structure your API requests to the Memberstack Admin REST API.

### Base URL

All API requests should be made to the following base URL:

https://admin.memberstack.com

### Authentication Headers

Include your secret key in the `X-API-KEY` header with every request:

// Example using fetch

fetch('https://admin.memberstack.com/members', {

headers: {

'X-API-KEY': 'sk_sb_your_secret_key'

}

})

// Example using Axios

const axios = require('axios');

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com';

axios.get(`${BASE_URL}/members`, {

headers: {

'X-API-KEY': API_KEY

}

})

💡 **Tip:**

When making API requests:

  * Always store your API key in environment variables
  * Set proper content headers (`Content-Type: application/json`) for POST/PATCH
  * Handle potential rate limiting with exponential backoff
  * Implement proper error handling for all responses



## Security Best Practices

Follow these best practices to ensure your integration with the Memberstack Admin REST API is secure.

### Secret Key Storage

  * Store secret keys in environment variables or a secure vault system (like AWS Secrets Manager, Hashicorp Vault, etc.)
  * Use different keys for development and production environments
  * Consider implementing key rotation for enhanced security
  * Limit key access to only necessary team members



### Server-Side Implementation

  * Only make API calls from secure server environments (Node.js, Python, Ruby, PHP, etc.)
  * Never expose endpoints that directly proxy your secret key
  * Use HTTPS for all API communication to ensure encryption of data in transit
  * Implement proper validation and sanitization for any user input that influences API calls



### Error Handling

  * Implement proper error handling for all API responses
  * Avoid exposing detailed error messages to clients that might reveal implementation details
  * Log errors securely for debugging without exposing sensitive information
  * Consider implementing retry logic with exponential backoff for transient errors



### Example Implementation

Here's a secure example of implementing the Memberstack Admin REST API in a Node.js environment:

// secure-memberstack.js

const axios = require('axios');

require('dotenv').config();

// Load API key from environment variables

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

if (!API_KEY) {

throw new Error('MEMBERSTACK_SECRET_KEY is not defined in environment variables');

}

// Create a configured axios instance

const memberstack = axios.create({

baseURL: 'https://admin.memberstack.com',

headers: {

'X-API-KEY': API_KEY,

'Content-Type': 'application/json'

}

});

// Add response interceptor for error handling

memberstack.interceptors.response.use(

response => response,

async error => {

// Handle rate limiting

if (error.response && error.response.status === 429) {

console.log('Rate limited. Retrying after delay...');

// Implement exponential backoff here

}

// Log error safely (without exposing sensitive data)

console.error('API Error:', {

status: error.response?.status,

url: error.config?.url,

method: error.config?.method

});

return Promise.reject(error);

}

);

// Export the configured client

module.exports = memberstack;

## Next Steps

Now that you understand the basics, you might want to explore:

  * [→ Member Actions (listing, creating, updating, deleting)](/admin-rest-api/member-actions)
  * [→ Token Verification](/admin-rest-api/verification)
  * [→ Common Use Cases](/admin-rest-api/common-use-cases)



## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
