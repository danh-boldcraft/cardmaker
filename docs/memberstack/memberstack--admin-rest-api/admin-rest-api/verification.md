[ Memberstack Developers Documentation](/)

[](/)

Admin Rest API

  * [Quick Start](/admin-rest-api/quick-start)

  * [Member Actions](/admin-rest-api/member-actions)

  * [Data Tables](/admin-rest-api/data-tables)

  * [Verification](/admin-rest-api/verification)

    * [Verify Member Token](/admin-rest-api/verification#verify-member-token)
    * [Common Use Cases](/admin-rest-api/verification#common-use-cases)
  * [Common Use Cases](/admin-rest-api/common-use-cases)

  * [FAQs](/admin-rest-api/faqs)




# Verification

The Memberstack Admin REST API provides methods for verifying security tokens. This is essential for protecting your resources and validating member authentication.

### Before You Start

  * Make sure you understand JWT tokens and their structure
  * Have your secret key ready (refer to the [Quick Start](/admin-rest-api/quick-start) guide for authentication details)
  * Understand the difference between client-side and server-side tokens



## Verify Member Token

Verify a JWT token issued to a member.

### Endpoint

POST https://admin.memberstack.com/members/verify-token

### Request Body

Parameter| Type| Required| Description  
---|---|---|---  
token| string| Yes| The JWT token to verify  
  
### Examples

Using curl:

curl --location --request POST 'https://admin.memberstack.com/members/verify-token' \

\--header 'x-api-key: sk_sb_your_secret_key' \

\--header 'Content-Type: application/json' \

\--data-raw '{

"token": "your_jwt_token_here"

}'

Using Axios:

const axios = require('axios');

const API_KEY = process.env.MEMBERSTACK_SECRET_KEY;

const BASE_URL = 'https://admin.memberstack.com/members';

const headers = {

"X-API-KEY": API_KEY,

"Content-Type": "application/json"

};

const data = {

token: "your_jwt_token_here" // The JWT token received from the client

};

try {

const response = await axios.post(`${BASE_URL}/verify-token`, data, { headers });

// Token is valid, you can now use the decoded data

const verifiedTokenData = response.data.data;

// Check member ID, expiration, etc.

const memberId = verifiedTokenData.id;

} catch (error) {

// Token is invalid or expired

console.error('Token verification failed:', error);

}

### Response

{

"data": {

"id": "mem_abc123", // Member ID

"type": "member", // Token type

"iat": 1681414876, // Issued at timestamp

"exp": 1682624476, // Expiration timestamp

"aud": "app_xyz456", // Audience (app ID)

"iss": "https://api.memberstack.com" // Issuer

}

}

#### Response Fields Explained

  * **id** : The member's ID in Memberstack
  * **type** : The token type (should be "member")
  * **iat** : Issued At Time - when the token was created (Unix timestamp)
  * **exp** : Expiration Time - when the token expires (Unix timestamp)
  * **aud** : Audience - your Memberstack app ID
  * **iss** : Issuer - who created the token (Memberstack API)



💡 **Tip:**

When working with token verification:

  * Always check the expiration time (`exp`) to ensure the token is still valid
  * Verify the token on your server before granting access to protected resources
  * Consider implementing caching to reduce API calls for frequent token verifications
  * Use the member ID from the verified token to look up additional details if needed



### ⚠️ About Webhook Verification

Please note that webhook signature verification is not currently supported through the REST API. For webhook verification, you must use the Node.js Admin Package instead.

If you need to verify webhooks in your application, please refer to the [Node.js Admin Package documentation](/admin-node-package/verification).

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

  * [→ Common Use Cases for the Admin REST API](/admin-rest-api/common-use-cases)
  * [→ Member Management](/admin-rest-api/member-actions)
  * [→ Frequently Asked Questions](/admin-rest-api/faqs)



## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
