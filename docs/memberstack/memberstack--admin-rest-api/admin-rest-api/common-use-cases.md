[ Memberstack Developers Documentation](/)

[](/)

Admin Rest API

  * [Quick Start](/admin-rest-api/quick-start)

  * [Member Actions](/admin-rest-api/member-actions)

  * [Data Tables](/admin-rest-api/data-tables)

  * [Verification](/admin-rest-api/verification)

  * [Common Use Cases](/admin-rest-api/common-use-cases)

    * [Server-side Integration](/admin-rest-api/common-use-cases#server-side-integration)
    * [Data Synchronization](/admin-rest-api/common-use-cases#data-synchronization)
    * [Bulk Operations](/admin-rest-api/common-use-cases#bulk-operations)
  * [FAQs](/admin-rest-api/faqs)




# Common Use Cases

This guide provides practical examples and patterns for integrating the Memberstack Admin REST API into your applications. These real-world examples demonstrate how to solve common challenges and implement effective member management strategies.

### Before You Start

  * Complete the [Quick Start](/admin-rest-api/quick-start) guide
  * Familiarize yourself with the [Member Actions](/admin-rest-api/member-actions) and [Verification](/admin-rest-api/verification) documentation
  * Have a basic understanding of server-side programming and API integration



## Server-side Integration

Best practices for integrating the Memberstack Admin REST API with your server-side applications.

### Creating a Reusable API Client

Instead of making direct API calls in multiple places, create a reusable client that handles authentication, error handling, and common operations:

// memberstack-api.js

const axios = require('axios');

require('dotenv').config();

class MemberstackAPI {

constructor(apiKey) {

this.apiKey = apiKey || process.env.MEMBERSTACK_SECRET_KEY;

this.baseURL = 'https://admin.memberstack.com';

// Create axios instance with default config

this.client = axios.create({

baseURL: this.baseURL,

headers: {

'X-API-KEY': this.apiKey,

'Content-Type': 'application/json'

}

});

// Add response interceptor for error handling

this.client.interceptors.response.use(

response => response,

error => {

const errorDetails = {

status: error.response?.status,

message: error.response?.data?.error || error.message,

url: error.config?.url,

method: error.config?.method

};

console.error('Memberstack API Error:', errorDetails);

// Handle rate limiting with exponential backoff

if (error.response?.status === 429) {

// Implement retry logic here

}

return Promise.reject(error);

}

);

}

// Member methods

async listMembers(options = {}) {

const response = await this.client.get('/members', { params: options });

return response.data;

}

async getMember(idOrEmail) {

const response = await this.client.get(`/members/${encodeURIComponent(idOrEmail)}`);

return response.data;

}

async createMember(memberData) {

const response = await this.client.post('/members', memberData);

return response.data;

}

async updateMember(id, memberData) {

const response = await this.client.patch(`/members/${id}`, memberData);

return response.data;

}

async deleteMember(id, options = {}) {

const response = await this.client.delete(`/members/${id}`, { data: options });

return response.data;

}

async addFreePlan(memberId, planId) {

const response = await this.client.post(`/members/${memberId}/add-plan`, { planId });

return response.data;

}

async removeFreePlan(memberId, planId) {

const response = await this.client.post(`/members/${memberId}/remove-plan`, { planId });

return response.data;

}

// Verification methods

async verifyToken(token) {

const response = await this.client.post('/members/verify-token', { token });

return response.data;

}

}

module.exports = new MemberstackAPI();

// Usage example:

// const memberstack = require('./memberstack-api');

// const members = await memberstack.listMembers({ limit: 10 });

💡 **Tip:**

Benefits of a reusable API client:

  * Centralizes authentication and error handling
  * Provides consistent interface across your application
  * Makes it easier to implement optimizations like caching
  * Simplifies testing and mocking in your applications
  * Reduces code duplication and maintenance effort



### Express.js Integration

Here's how to integrate the Memberstack API with an Express.js application using middleware for authentication:

// middleware/auth.js

const memberstackApi = require('../services/memberstack-api');

// Middleware to verify authentication

async function requireAuth(req, res, next) {

try {

// Extract token from Authorization header

const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {

return res.status(401).json({ error: 'Authentication required' });

}

const token = authHeader.split(' ')[1];

// Verify the token

const response = await memberstackApi.verifyToken(token);

// Add member data to request

req.member = response.data;

// Proceed to next middleware/route handler

next();

} catch (error) {

return res.status(401).json({ error: 'Invalid authentication' });

}

}

// Middleware to check for specific plan

function requirePlan(planId) {

return async (req, res, next) => {

try {

if (!req.member || !req.member.id) {

return res.status(401).json({ error: 'Authentication required' });

}

// Get full member details

const memberResponse = await memberstackApi.getMember(req.member.id);

const member = memberResponse.data;

// Check if member has the required plan

const hasPlan = member.planConnections.some(

plan => plan.planId === planId && plan.status === 'ACTIVE'

);

if (!hasPlan) {

return res.status(403).json({ error: 'Required plan not found' });

}

next();

} catch (error) {

return res.status(500).json({ error: 'Error verifying plan' });

}

};

}

module.exports = { requireAuth, requirePlan };

// app.js

const express = require('express');

const { requireAuth, requirePlan } = require('./middleware/auth');

const app = express();

// Public route

app.get('/api/public', (req, res) => {

res.json({ message: 'This is public data' });

});

// Protected route

app.get('/api/protected', requireAuth, (req, res) => {

res.json({

message: 'This is protected data',

memberId: req.member.id

});

});

// Premium route (requires specific plan)

app.get(

'/api/premium',

requireAuth,

requirePlan('pln_premium_plan'),

(req, res) => {

res.json({ message: 'This is premium content' });

}

);

### Next.js API Routes

Integrating with Next.js API routes for server-side operations:

// lib/memberstack-api.js

// (Include the MemberstackAPI class from earlier)

// pages/api/members/index.js

import memberstackApi from '../../../lib/memberstack-api';

export default async function handler(req, res) {

// Basic CORS headers

res.setHeader('Access-Control-Allow-Origin', '*');

res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

// Handle OPTIONS request for CORS preflight

if (req.method === 'OPTIONS') {

return res.status(200).end();

}

try {

// GET - List members with pagination

if (req.method === 'GET') {

const { limit, after, order } = req.query;

const result = await memberstackApi.listMembers({

limit: limit ? parseInt(limit) : undefined,

after: after ? parseInt(after) : undefined,

order

});

return res.status(200).json(result);

}

// POST - Create a new member

if (req.method === 'POST') {

const result = await memberstackApi.createMember(req.body);

return res.status(201).json(result);

}

// Method not allowed

return res.status(405).json({ error: 'Method not allowed' });

} catch (error) {

const statusCode = error.response?.status || 500;

const errorMessage = error.response?.data?.error || 'An error occurred';

return res.status(statusCode).json({ error: errorMessage });

}

}

// pages/api/members/[id].js

import memberstackApi from '../../../lib/memberstack-api';

export default async function handler(req, res) {

// CORS headers (same as above)

const { id } = req.query;

try {

// GET - Retrieve a member

if (req.method === 'GET') {

const result = await memberstackApi.getMember(id);

return res.status(200).json(result);

}

// PATCH - Update a member

if (req.method === 'PATCH') {

const result = await memberstackApi.updateMember(id, req.body);

return res.status(200).json(result);

}

// DELETE - Delete a member

if (req.method === 'DELETE') {

const result = await memberstackApi.deleteMember(id, req.body);

return res.status(200).json(result);

}

// Method not allowed

return res.status(405).json({ error: 'Method not allowed' });

} catch (error) {

const statusCode = error.response?.status || 500;

const errorMessage = error.response?.data?.error || 'An error occurred';

return res.status(statusCode).json({ error: errorMessage });

}

}

#### Important Security Considerations

  * Never expose your Admin API endpoints publicly without authentication
  * Implement proper authorization checks for admin-only actions
  * Consider using a more restrictive CORS policy in production
  * Add rate limiting to your API routes to prevent abuse



## Data Synchronization

Keep your application database in sync with Memberstack data.

### Syncing Member Data to Your Database

Many applications need to store member data in their own database for performance, querying, or to add additional custom fields. Here's an example of syncing member data:

// sync-members.js

const memberstackApi = require('./memberstack-api');

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Sync a single member

async function syncMember(memberId) {

try {

// Get member data from Memberstack

const response = await memberstackApi.getMember(memberId);

const member = response.data;

// Prepare data for database

const dbData = {

memberstackId: member.id,

email: member.auth.email,

createdAt: new Date(member.createdAt),

lastLogin: member.lastLogin ? new Date(member.lastLogin) : null,

firstName: member.customFields?.firstName || null,

lastName: member.customFields?.lastName || null,

country: member.customFields?.country || null,

// Add other fields as needed

// For plans, you might want to store them as JSON or in a related table

activePlans: member.planConnections

.filter(plan => plan.status === 'ACTIVE')

.map(plan => plan.planId)

};

// Upsert the member in your database

await prisma.user.upsert({

where: { memberstackId: member.id },

update: dbData,

create: dbData

});

console.log(`Synced member ${member.id}`);

return true;

} catch (error) {

console.error(`Error syncing member ${memberId}:`, error);

return false;

}

}

// Sync all members (with pagination)

async function syncAllMembers() {

try {

let hasNextPage = true;

let after = null;

let count = 0;

// Process all pages

while (hasNextPage) {

// Get page of members

const response = await memberstackApi.listMembers({

limit: 25,

after

});

// Process each member in parallel

await Promise.all(

response.data.map(member => syncMember(member.id))

);

// Update counters and pagination

count += response.data.length;

after = response.endCursor;

hasNextPage = response.hasNextPage;

console.log(`Processed ${count} members so far`);

}

console.log(`Completed sync of ${count} members`);

return count;

} catch (error) {

console.error('Error in syncAllMembers:', error);

throw error;

}

}

// Schedule regular syncs

async function scheduleSync() {

// Run initial sync

await syncAllMembers();

// Schedule regular sync (e.g., every 24 hours)

setInterval(syncAllMembers, 24 * 60 * 60 * 1000);

}

module.exports = { syncMember, syncAllMembers, scheduleSync };

💡 **Tip:**

Tips for data synchronization:

  * Consider incremental syncs (changed members only) for better performance
  * Implement retry logic with exponential backoff for API failures
  * Use database transactions for atomic updates
  * Log sync activities for debugging and audit purposes
  * Consider using webhooks (when available) for real-time updates



### Change Detection

To optimize synchronization, implement a change detection strategy by tracking the last sync time and only updating changed records:

// Implement incremental sync with change detection

async function syncChangedMembers() {

try {

// Get last sync timestamp from database

const syncRecord = await prisma.syncLog.findFirst({

where: { type: 'member_sync' },

orderBy: { completedAt: 'desc' }

});

const lastSyncTime = syncRecord?.completedAt || new Date(0);

const currentSyncTime = new Date();

console.log(`Syncing members changed since ${lastSyncTime}`);

// Ideally, you would have an API endpoint to get members modified after a date

// Since this doesn't exist in the current API, you'll need to fetch all members

// and filter in your application

let hasNextPage = true;

let after = null;

let changedCount = 0;

// Process all pages

while (hasNextPage) {

const response = await memberstackApi.listMembers({

limit: 50,

after

});

// Get members that were created or updated since last sync

// Note: This is a simplification. In reality, you'd need a more 

// sophisticated approach since the API doesn't expose "updatedAt"

const changedMembers = response.data.filter(member => {

const createdAt = new Date(member.createdAt);

return createdAt > lastSyncTime;

});

// Sync changed members

if (changedMembers.length > 0) {

await Promise.all(

changedMembers.map(member => syncMember(member.id))

);

changedCount += changedMembers.length;

}

// Update pagination

after = response.endCursor;

hasNextPage = response.hasNextPage;

}

// Log the completed sync

await prisma.syncLog.create({

data: {

type: 'member_sync',

startedAt: lastSyncTime,

completedAt: currentSyncTime,

recordsProcessed: changedCount

}

});

console.log(`Completed sync of ${changedCount} changed members`);

return changedCount;

} catch (error) {

console.error('Error in syncChangedMembers:', error);

throw error;

}

}

⚠️ **Important:**

The current Memberstack API doesn't include an `updatedAt` field or provide filtering by modification date. The example above is a simplified approach that only checks creation dates. For a more robust solution, you might need to:

  * Store a hash of each member's data to detect changes
  * Implement a webhook handler to receive real-time updates
  * Periodically perform full syncs to catch any missed changes



## Bulk Operations

Efficiently manage multiple members using the Admin REST API.

### Batch Processing Members

When you need to process many members, such as adding a plan to everyone in a specific group, use an efficient batch processing approach:

// bulk-operations.js

const memberstackApi = require('./memberstack-api');

/**

* Process members in batches with a custom operation

* @param {Function} operationFn - Function to apply to each member

* @param {Object} options - Options for batch processing

*/

async function batchProcessMembers(operationFn, options = {}) {

const {

batchSize = 10, // Number of concurrent operations

limit = 50, // Members per page

delay = 100, // Delay between batches (ms)

filter = () => true // Filter function for members

} = options;

let hasNextPage = true;

let after = null;

let processedCount = 0;

let successCount = 0;

let failureCount = 0;

// Process all pages

while (hasNextPage) {

// Get page of members

const response = await memberstackApi.listMembers({

limit,

after

});

// Filter members

const members = response.data.filter(filter);

// Process in batches to avoid overwhelming the API

for (let i = 0; i < members.length; i += batchSize) {

const batch = members.slice(i, i + batchSize);

// Process batch in parallel

const results = await Promise.allSettled(

batch.map(member => operationFn(member))

);

// Count results

results.forEach(result => {

if (result.status === 'fulfilled') {

successCount++;

} else {

failureCount++;

console.error(

`Operation failed for member ${result.reason?.memberId || 'unknown'}:`,

result.reason

);

}

});

// Add delay between batches to avoid rate limiting

if (i + batchSize < members.length) {

await new Promise(resolve => setTimeout(resolve, delay));

}

}

// Update counters and pagination

processedCount += members.length;

after = response.endCursor;

hasNextPage = response.hasNextPage;

console.log(

`Processed batch: ${processedCount} members, ` +

`${successCount} successes, ${failureCount} failures`

);

// Add delay between pages

if (hasNextPage) {

await new Promise(resolve => setTimeout(resolve, delay));

}

}

return {

processedCount,

successCount,

failureCount

};

}

// Example: Add a free plan to all members from a specific country

async function addPlanToMembersByCountry(planId, country) {

const operation = async (member) => {

if (member.customFields?.country === country) {

await memberstackApi.addFreePlan(member.id, planId);

return { success: true, memberId: member.id };

}

return { skipped: true, memberId: member.id };

};

return batchProcessMembers(operation, {

batchSize: 5,

delay: 200

});

}

// Example: Update all members' custom fields

async function updateAllMembersCustomField(fieldName, value, filterFn = () => true) {

const operation = async (member) => {

// Get current custom fields

const customFields = {

...(member.customFields || {}),

[fieldName]: value

};

// Update the member

await memberstackApi.updateMember(member.id, { customFields });

return { success: true, memberId: member.id };

};

return batchProcessMembers(operation, {

batchSize: 5,

delay: 200,

filter: filterFn

});

}

module.exports = {

batchProcessMembers,

addPlanToMembersByCountry,

updateAllMembersCustomField

};

#### Rate Limit Management

Remember that the Memberstack API has a rate limit of 25 requests per second. The following strategies can help you avoid hitting this limit:

  * Process operations in smaller batches (5-10 at a time)
  * Add delays between batches and API calls
  * Implement exponential backoff for retry logic
  * Run bulk operations during off-peak hours
  * Monitor API response times and adjust batch sizes dynamically



### Error Recovery in Bulk Operations

When processing large numbers of members, it's important to handle errors gracefully and provide recovery options:

// Implement error recovery for bulk operations

async function resumableBatchOperation(operationFn, options = {}) {

const {

jobId = Date.now().toString(), // Unique identifier for this job

startAfter = null // Resume from this cursor

} = options;

// Set up tracking

let currentCursor = startAfter;

let processedIds = new Set();

let hasNextPage = true;

try {

// Process pages until complete

while (hasNextPage) {

// Get page of members

const response = await memberstackApi.listMembers({

limit: options.limit || 50,

after: currentCursor

});

// Process members with the operation function

for (const member of response.data) {

// Skip already processed members

if (processedIds.has(member.id)) continue;

try {

await operationFn(member);

processedIds.add(member.id);

// Save progress to database or file

await saveProgress(jobId, {

cursor: currentCursor,

processedIds: Array.from(processedIds)

});

} catch (error) {

console.error(`Error processing member ${member.id}:`, error);

// Log the error but continue with next member

await logError(jobId, member.id, error);

}

}

// Update pagination

currentCursor = response.endCursor;

hasNextPage = response.hasNextPage;

}

console.log(`Job ${jobId} completed. Processed ${processedIds.size} members`);

return { success: true, processedCount: processedIds.size };

} catch (error) {

console.error(`Job ${jobId} failed at cursor ${currentCursor}:`, error);

return {

success: false,

error,

resumePoint: currentCursor,

processedCount: processedIds.size

};

}

}

// Helper to save progress

async function saveProgress(jobId, data) {

// Save to database or file

// Example with file system:

const fs = require('fs').promises;

await fs.writeFile(

`./progress-${jobId}.json`,

JSON.stringify(data),

'utf8'

);

}

// Helper to log errors

async function logError(jobId, memberId, error) {

// Log to database or file

// Example with file system:

const fs = require('fs').promises;

const errorLog = {

timestamp: new Date().toISOString(),

memberId,

error: error.message

};

// Append to error log

await fs.appendFile(

`./errors-${jobId}.json`,

JSON.stringify(errorLog) + '\n',

'utf8'

);

}

// Example usage: Resume a failed job

async function resumeFailedJob(jobId) {

try {

// Load progress data

const fs = require('fs').promises;

const data = JSON.parse(

await fs.readFile(`./progress-${jobId}.json`, 'utf8')

);

// Define the operation

const operation = async (member) => {

// Your operation code here

};

// Resume the job

return resumableBatchOperation(operation, {

jobId,

startAfter: data.cursor

});

} catch (error) {

console.error(`Failed to resume job ${jobId}:`, error);

return { success: false, error };

}

}

## Next Steps

Now that you've explored common use cases, you might want to check out:

  * [→ Frequently Asked Questions](/admin-rest-api/faqs)
  * [→ Member Actions Reference](/admin-rest-api/member-actions)
  * [→ Token Verification](/admin-rest-api/verification)



## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
