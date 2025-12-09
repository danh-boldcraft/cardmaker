[ Memberstack Developers Documentation](/)

[](/)

Admin Node Package

  * [Quick Start](/admin-node-package/quick-start)

  * [Member Actions](/admin-node-package/member-actions)

  * [Verification](/admin-node-package/verification)

    * [Verify member token](/admin-node-package/verification#verify-member-token)
    * [Verify webhook signature](/admin-node-package/verification#verify-webhook-signature)
    * [Common use cases](/admin-node-package/verification#common-use-cases)
  * [Common Use Cases](/admin-node-package/common-use-cases)

  * [FAQs](/admin-node-package/faqs)




# Verification

The Memberstack Admin Package provides essential verification functionality for secure server-side operations, including token verification and webhook validation. These features are crucial for maintaining security in your Memberstack implementation.

### Before You Start

  * Make sure you've initialized the Admin Package with your secret key as shown in the [Quick Start](/admin-node-package/quick-start) guide
  * For webhook verification, you'll need your webhook secret from the Memberstack dashboard
  * Understanding of JWT tokens is helpful for token verification



## Verify Member Token

Validate a member's JWT token and access the payload.

The `verifyToken()` method allows you to validate Memberstack JWT tokens and extract member information:

// Basic token verification

const tokenData = await memberstack.verifyToken({

token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",

});

// With audience validation (recommended)

const tokenData = await memberstack.verifyToken({

token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",

audience: "app_your_app_id"

});

if (tokenData) {

console.log(`Verified member ID: ${tokenData.id}`);

console.log(`Token expires at: ${new Date(tokenData.exp * 1000).toLocaleString()}`);

}

#### Token Verification Response:

{

id: "mem_abc123",

type: "member",

iat: 1633486880169, // Issued at timestamp

exp: 1633486880369, // Expiration timestamp

iss: "https://api.memberstack.com", // Issuer

aud: "app_xyz789" // Audience (your app ID)

}

#### Token Verification Parameters

  * **Required:**
    * `token` \- The JWT token to verify (usually from Authorization header)
  * **Optional:**
    * `audience` \- Your app ID for additional verification (recommended for enhanced security)



💡 **Tip:**

Best practices for token verification:

  * Always include audience validation when possible
  * Implement proper error handling for expired or invalid tokens
  * Check the token expiration time to handle near-expiry scenarios
  * Store the member ID from the token for database lookups



### Using the Token in Your Application

Here's an example of how to create an Express.js middleware for authenticating member requests:

// auth.middleware.js

const memberstackAdmin = require('@memberstack/admin');

const memberstack = memberstackAdmin.init(process.env.MEMBERSTACK_SECRET_KEY);

/**

* Express middleware to verify Memberstack authentication

*/

async function requireAuth(req, res, next) {

try {

// Extract token from Authorization header

const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {

return res.status(401).json({ error: 'Authentication required' });

}

const token = authHeader.split(' ')[1];

// Verify the token

const verifiedToken = await memberstack.verifyToken({

token,

audience: process.env.MEMBERSTACK_APP_ID

});

// Add member data to the request object

req.member = verifiedToken;

// Token is valid, proceed

next();

} catch (error) {

console.error('Authentication error:', error.message);

// Determine the appropriate error response

if (error.message.includes('expired')) {

return res.status(401).json({ error: 'Authentication expired' });

}

return res.status(401).json({ error: 'Invalid authentication' });

}

}

module.exports = { requireAuth };

#### Common Token Issues

  * **Expired tokens:** The token has passed its expiration time and is no longer valid
  * **Invalid signature:** The token has been tampered with or was created with a different key
  * **Audience mismatch:** The token was issued for a different application than expected
  * **Format errors:** The token is malformed or doesn't follow JWT standards



## Verify Webhook Signature

Ensure webhook payloads are authentic and haven't been tampered with.

Memberstack uses Svix under the hood for secure webhook delivery. This section explains how to properly verify incoming webhook requests to ensure they are legitimate and haven't been tampered with.

⚠️ **Important:**

**Important Header Information:** Memberstack webhook verification requires specific headers that are sent with each webhook request:

  * `svix-id` \- Unique identifier for the webhook event
  * `svix-timestamp` \- When the webhook was sent
  * `svix-signature` \- The cryptographic signature for verification



Always use these exact header names in your verification code. Previous header formats (like `ms-webhook-id`) are no longer supported.

### Basic Verification Example

Here's how to verify a webhook signature in an Express.js application:

// Express.js webhook verification example

const express = require('express');

const memberstackAdmin = require('@memberstack/admin');

const app = express();

const memberstack = memberstackAdmin.init(process.env.MEMBERSTACK_SECRET_KEY);

// Important: Use express.raw() to preserve the raw body for signature verification

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {

try {

// The raw body is needed for verification (don't parse to JSON first)

const payload = req.body.toString();

// Get the headers exactly as they come from the request

const headers = {

'svix-id': req.headers['svix-id'],

'svix-timestamp': req.headers['svix-timestamp'],

'svix-signature': req.headers['svix-signature']

};

// Verify the webhook

const isValid = memberstack.verifyWebhookSignature({

payload: JSON.parse(payload), // Parse the payload for processing after verification

headers: headers, // Pass the headers object

secret: process.env.MEMBERSTACK_WEBHOOK_SECRET // Your webhook secret from dashboard

});

if (isValid) {

// Webhook is verified, safe to process

const data = JSON.parse(payload);

console.log(`Verified webhook event: ${data.event}`);

// Process the webhook based on event type

switch (data.event) {

case 'member.created':

// Handle member creation

break;

case 'member.updated':

// Handle member update

break;

// Add more event types as needed

}

// Return a 200 response to acknowledge receipt

res.status(200).send('Webhook received and verified');

} else {

// Invalid signature

console.error('Invalid webhook signature');

res.status(401).send('Invalid signature');

}

} catch (error) {

console.error('Webhook verification error:', error);

res.status(400).send(`Webhook error: ${error.message}`);

}

});

💡 **Tip:**

**Common Verification Issues:**

  * **Use`express.raw()`** \- Not `express.json()` for the webhook endpoint
  * **Preserve the raw body** \- Modifying the body before verification will cause signature failure
  * **Header case sensitivity** \- Headers may be lowercased by some frameworks; check case sensitivity
  * **Correct webhook secret** \- Make sure you're using the correct webhook secret from your dashboard
  * **Parse JSON after verification** \- Only parse the JSON payload after verifying the signature



### Troubleshooting Header Errors

If you encounter the error "`Please provide the svix-id, svix-timestamp, and svix-signature headers`", follow these steps:

#### Header Troubleshooting

  1. **Debug the headers you're receiving:**

1

2

// Log all headers to see what's actually being received

console.log('All headers:', req.headers);

  2. **Check for case transformations:** Some frameworks convert headers to lowercase. Try: 

// Try lowercase header access

const headers = {

'svix-id': req.headers['svix-id'] || req.headers['Svix-Id'] || req.headers['SVIX-ID'],

'svix-timestamp': req.headers['svix-timestamp'] || req.headers['Svix-Timestamp'] || req.headers['SVIX-TIMESTAMP'],

'svix-signature': req.headers['svix-signature'] || req.headers['Svix-Signature'] || req.headers['SVIX-SIGNATURE']

};

  3. **Pass headers object directly:** Some frameworks may allow access to the raw headers: 

// Try passing all headers

const isValid = memberstack.verifyWebhookSignature({

payload: JSON.parse(payload),

headers: req.headers, // Pass all headers and let the package find what it needs

secret: process.env.MEMBERSTACK_WEBHOOK_SECRET

});




### Next.js API Route Example

For Next.js API routes, you'll need to disable the built-in body parsing:

// pages/api/webhook.js

import memberstackAdmin from '@memberstack/admin';

// Initialize Memberstack outside the handler

const memberstack = memberstackAdmin.init(process.env.MEMBERSTACK_SECRET_KEY);

// Important: Disable body parsing

export const config = {

api: {

bodyParser: false,

},

};

export default async function handler(req, res) {

if (req.method !== 'POST') {

return res.status(405).json({ error: 'Method not allowed' });

}

try {

// Get the raw body

const chunks = [];

for await (const chunk of req) {

chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);

}

const rawBody = Buffer.concat(chunks).toString('utf8');

// Verify webhook

const isValid = memberstack.verifyWebhookSignature({

payload: JSON.parse(rawBody),

headers: req.headers,

secret: process.env.MEMBERSTACK_WEBHOOK_SECRET

});

if (isValid) {

const data = JSON.parse(rawBody);

console.log(`Webhook event: ${data.event}`);

// Process webhook...

return res.status(200).json({ success: true });

} else {

console.error('Invalid webhook signature');

return res.status(401).json({ error: 'Invalid signature' });

}

} catch (error) {

console.error('Webhook error:', error);

return res.status(400).json({ error: error.message });

}

}

### Webhook Security Best Practices

  * Always verify the webhook signature to prevent spoofing
  * Implement idempotency using the webhook ID to prevent duplicate processing
  * Store webhook events in a queue to ensure reliable processing
  * Set up appropriate timeouts for webhook processing
  * Return 2xx status codes promptly to acknowledge receipt (even if processing continues asynchronously)
  * Rotate webhook secrets periodically for enhanced security



### Finding Your Webhook Secret

To get your webhook secret:

  1. Log in to your Memberstack dashboard
  2. Navigate to "DevTools" > "Webhooks"
  3. Find or create your webhook endpoint
  4. Copy the "Signing Secret" value



Store this secret securely in your environment variables, not in your code.

## Common Use Cases

Practical examples for implementing token verification.

### Express.js Authentication Middleware

Here's an example of creating a reusable middleware for authenticating requests in an Express.js application:

// middleware/auth.js

const axios = require('axios');

require('dotenv').config();

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com/members';

/**

* Middleware to verify Memberstack authentication

*/

async function requireAuth(req, res, next) {

try {

// Extract token from Authorization header

const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {

return res.status(401).json({ error: 'Authentication required' });

}

const token = authHeader.split(' ')[1];

// Verify the token with Memberstack

const response = await axios.post(

`${BASE_URL}/verify-token`,

{ token },

{

headers: {

'X-API-KEY': API_KEY,

'Content-Type': 'application/json'

}

}

);

// Add member data to the request object

req.member = response.data.data;

// Token is valid, proceed

next();

} catch (error) {

console.error('Authentication error:', error.message);

// Determine the appropriate error response

if (error.response?.status === 401) {

return res.status(401).json({ error: 'Authentication expired' });

}

return res.status(401).json({ error: 'Invalid authentication' });

}

}

module.exports = { requireAuth };

// Usage in your routes

// routes/api.js

const express = require('express');

const router = express.Router();

const { requireAuth } = require('../middleware/auth');

// Public route - no authentication required

router.get('/public', (req, res) => {

res.json({ message: 'This is a public endpoint' });

});

// Protected route - requires authentication

router.get('/protected', requireAuth, (req, res) => {

res.json({

message: 'This is a protected endpoint',

memberId: req.member.id

});

});

module.exports = router;

### Next.js API Route Protection

Here's how to protect API routes in a Next.js application:

// pages/api/protected-data.js

import axios from 'axios';

// Helper function to verify Memberstack token

async function verifyToken(token) {

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com/members';

try {

const response = await axios.post(

`${BASE_URL}/verify-token`,

{ token },

{

headers: {

'X-API-KEY': API_KEY,

'Content-Type': 'application/json'

}

}

);

return response.data.data;

} catch (error) {

return null;

}

}

export default async function handler(req, res) {

// Get auth token from header

const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {

return res.status(401).json({ error: 'Authentication required' });

}

const token = authHeader.split(' ')[1];

// Verify the token

const memberData = await verifyToken(token);

if (!memberData) {

return res.status(401).json({ error: 'Invalid or expired token' });

}

// Check if token is expired

const now = Math.floor(Date.now() / 1000);

if (memberData.exp < now) {

return res.status(401).json({ error: 'Token expired' });

}

// Token is valid, return protected data

return res.status(200).json({

message: 'Protected data accessed successfully',

memberId: memberData.id,

data: {

// Your protected data here

sensitiveInformation: 'This is protected content',

memberSpecificData: `Data for member ${memberData.id}`

}

});

}

### Permission-Based Access Control

Implement role-based or permission-based access control by combining token verification with member data:

// middleware/rbac.js

const axios = require('axios');

require('dotenv').config();

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com';

/**

* Middleware to check if member has a required plan

* @param {string} requiredPlanId - The plan ID to check for

*/

function requirePlan(requiredPlanId) {

return async (req, res, next) => {

try {

// First ensure we have a verified member

if (!req.member || !req.member.id) {

return res.status(401).json({ error: 'Authentication required' });

}

// Get full member details

const memberResponse = await axios.get(

`${BASE_URL}/members/${req.member.id}`,

{

headers: { 'X-API-KEY': API_KEY }

}

);

const member = memberResponse.data.data;

// Check if member has the required plan

const hasPlan = member.planConnections.some(

plan => plan.planId === requiredPlanId && plan.status === 'ACTIVE'

);

if (!hasPlan) {

return res.status(403).json({ error: 'Access denied. Required plan not found.' });

}

// Member has the required plan, proceed

next();

} catch (error) {

console.error('Plan verification error:', error.message);

return res.status(500).json({ error: 'Error verifying access' });

}

};

}

module.exports = { requirePlan };

// Usage example

// routes/premium-api.js

const express = require('express');

const router = express.Router();

const { requireAuth } = require('../middleware/auth');

const { requirePlan } = require('../middleware/rbac');

// Protected premium route

router.get(

'/premium-content',

requireAuth,

requirePlan('pln_premium'),

(req, res) => {

res.json({

message: 'This is premium content',

content: 'Your exclusive premium data here'

});

}

);

module.exports = router;

## Next Steps

Now that you understand token verification, you might want to explore:

  * [→ Common Use Cases for the Admin REST API](/admin-node-package/common-use-cases)
  * [→ Member Management](/admin-node-package/member-actions)
  * [→ Frequently Asked Questions](/admin-node-package/faqs)



## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
