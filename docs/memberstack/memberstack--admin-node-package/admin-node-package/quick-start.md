[ Memberstack Developers Documentation](/)

[](/)

Admin Node Package

  * [Quick Start](/admin-node-package/quick-start)

    * [Installation & Setup](/admin-node-package/quick-start#installation-setup)
    * [Basic Configuration](/admin-node-package/quick-start#basic-configuration)
    * [Framework Integration](/admin-node-package/quick-start#framework-integration)
  * [Member Actions](/admin-node-package/member-actions)

  * [Verification](/admin-node-package/verification)

  * [Common Use Cases](/admin-node-package/common-use-cases)

  * [FAQs](/admin-node-package/faqs)




# Quick Start

Welcome to the Memberstack Admin Node.js Package! This guide will help you get started with the server-side capabilities of Memberstack, including member management, webhook verification, and token validation.

### Before You Start

  * You need a Node.js environment to use this package
  * Access to your Memberstack secret key
  * For paid functionality, a Memberstack account with an active billing method is required



## Installation & Setup

Follow these steps to install and set up the Admin package in your Node.js project.

Install the Memberstack Admin Package in your Node.js project:

npm install @memberstack/admin

\- or -

yarn add @memberstack/admin

After installation, you'll need to import the package in your code:

import memberstackAdmin from "@memberstack/admin";

💡 **Tip:**

The Admin Package is designed for server-side use only. Never include your secret key in client-side code. If you need client-side authentication, use the DOM Package instead.

## Basic Configuration

Essential configuration steps to get your Memberstack Admin integration working securely.

Initialize the Admin Package with your secret key:

import memberstackAdmin from "@memberstack/admin";

// Initialize with your secret key

const memberstack = memberstackAdmin.init("sk_your_secret_key");

⚠️ **Important:**

Your secret key provides administrative access to your Memberstack account. Always keep it secure and never expose it in client-side code, public repositories, or browser environments.

#### Secret Key Types

  * **Test Mode Keys** : Start with `sk_sb_` and are used for development and testing
  * **Live Mode Keys** : Start with `sk_` and are used for production environments



#### ⚠️ Security Best Practices

  * Store your secret keys in environment variables, not in code
  * Use different keys for development and production environments
  * Never commit your secret keys to version control
  * Rotate your keys periodically for enhanced security



## Framework Integration

Integrate Memberstack Admin with popular server-side frameworks.

### Express.js Integration

Here's how to integrate Memberstack Admin with Express.js for authentication middleware:

// app.js or server.js

import express from 'express';

import memberstackAdmin from '@memberstack/admin';

import dotenv from 'dotenv';

// Load environment variables

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

// Initialize Memberstack

const memberstack = memberstackAdmin.init(process.env.MEMBERSTACK_SECRET_KEY);

// Middleware to verify Memberstack tokens

async function authMiddleware(req, res, next) {

try {

// Extract token from Authorization header

const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {

return res.status(401).json({ error: 'No token provided' });

}

const token = authHeader.split(' ')[1];

// Verify the token

const tokenData = await memberstack.verifyToken({

token,

audience: process.env.MEMBERSTACK_APP_ID // Optional but recommended

});

// Add member info to request

req.member = tokenData;

next();

} catch (error) {

return res.status(401).json({ error: 'Invalid token' });

}

}

// Public route

app.get('/api/public', (req, res) => {

res.json({ message: 'This is a public endpoint' });

});

// Protected route

app.get('/api/protected', authMiddleware, (req, res) => {

res.json({

message: 'This is a protected endpoint',

memberId: req.member.id

});

});

app.listen(port, () => {

console.log(`Server running on port ${port}`);

});

### Next.js API Routes

Here's how to use Memberstack Admin in Next.js API routes:

// pages/api/protected.js

import memberstackAdmin from '@memberstack/admin';

// Initialize Memberstack outside of the handler for better performance

const memberstack = memberstackAdmin.init(process.env.MEMBERSTACK_SECRET_KEY);

export default async function handler(req, res) {

try {

// Extract token

const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {

return res.status(401).json({ error: 'No token provided' });

}

const token = authHeader.split(' ')[1];

// Verify the token

const tokenData = await memberstack.verifyToken({

token,

audience: process.env.MEMBERSTACK_APP_ID

});

// Return protected data

return res.status(200).json({

message: 'Protected data accessed successfully',

memberId: tokenData.id

});

} catch (error) {

return res.status(401).json({ error: 'Authentication failed' });

}

}

### Serverless Functions

For serverless environments like AWS Lambda or Vercel Functions, keep these considerations in mind:

#### Serverless Best Practices

  * Initialize the Memberstack client outside the handler function to take advantage of container reuse
  * Implement proper error handling to ensure helpful response messages when authentication fails
  * Be mindful of cold start times if your function needs to process many requests
  * Consider caching verified tokens during the function's lifecycle for better performance



## Next Steps

Now that you've set up the Admin Package, you might want to explore:

  * [→ Member Actions (create, read, update, delete)](/admin-node-package/member-actions)
  * [→ Token and Webhook Verification](/admin-node-package/verification)
  * [→ Common Use Cases](/admin-node-package/common-use-cases)



## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
