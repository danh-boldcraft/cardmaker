[ Memberstack Developers Documentation](/)

[](/)

Admin Node Package

  * [Quick Start](/admin-node-package/quick-start)

  * [Member Actions](/admin-node-package/member-actions)

  * [Verification](/admin-node-package/verification)

  * [Common Use Cases](/admin-node-package/common-use-cases)

    * [Server-side Authentication](/admin-node-package/common-use-cases#server-side-authentication)
    * [Webhook Processing](/admin-node-package/common-use-cases#webhook-processing)
    * [Custom Backend Logic](/admin-node-package/common-use-cases#custom-backend-logic)
  * [FAQs](/admin-node-package/faqs)




# Common Use Cases

This section provides practical examples and patterns for implementing the Admin package in real-world scenarios. These examples demonstrate how to integrate Memberstack's server-side functionality into your application architecture.

## Server-side Authentication

Implement secure authentication and authorization in your backend services.

### Express.js Authentication Middleware

Create a reusable middleware to protect your API routes with Memberstack authentication:

// middleware/auth.js

const memberstackAdmin = require('@memberstack/admin');

const memberstack = memberstackAdmin.init(process.env.MEMBERSTACK_SECRET_KEY);

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

### Role-Based Access Control

Implement role-based access control by checking member permissions or plans:

// middleware/rbac.js

const memberstackAdmin = require('@memberstack/admin');

const memberstack = memberstackAdmin.init(process.env.MEMBERSTACK_SECRET_KEY);

/**

* Middleware to check if member has required plan

* @param {string} requiredPlanId - The plan ID to check for

*/

function requirePlan(requiredPlanId) {

return async (req, res, next) => {

try {

// First ensure we have a verified member from the auth middleware

if (!req.member || !req.member.id) {

return res.status(401).json({ error: 'Authentication required' });

}

// Get full member details to check plans

const memberResponse = await memberstack.members.retrieve({

id: req.member.id

});

const member = memberResponse.data;

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

/**

* Middleware to check if member has required permission

* @param {string} requiredPermission - The permission to check for

*/

function requirePermission(requiredPermission) {

return async (req, res, next) => {

try {

// First ensure we have a verified member from the auth middleware

if (!req.member || !req.member.id) {

return res.status(401).json({ error: 'Authentication required' });

}

// Get full member details to check permissions

const memberResponse = await memberstack.members.retrieve({

id: req.member.id

});

const member = memberResponse.data;

// Check if member has the required permission

const hasPermission = member.permissions.includes(requiredPermission);

if (!hasPermission) {

return res.status(403).json({ error: 'Access denied. Required permission not found.' });

}

// Member has the required permission, proceed

next();

} catch (error) {

console.error('Permission verification error:', error.message);

return res.status(500).json({ error: 'Error verifying access' });

}

};

}

module.exports = { requirePlan, requirePermission };

// Usage in your routes

// routes/api.js

const express = require('express');

const router = express.Router();

const { requireAuth } = require('../middleware/auth');

const { requirePlan, requirePermission } = require('../middleware/rbac');

// Route requiring premium plan

router.get(

'/premium-content',

requireAuth,

requirePlan('pln_premium'),

(req, res) => {

res.json({ message: 'This is premium content' });

}

);

// Route requiring admin permission

router.get(

'/admin',

requireAuth,

requirePermission('admin:access'),

(req, res) => {

res.json({ message: 'This is admin content' });

}

);

module.exports = router;

#### Performance Considerations

The example above makes a separate API call to get the full member details. For better performance in production:

  * Consider implementing caching for member data
  * Use a distributed cache like Redis for multi-server environments to avoid race conditions
  * Set appropriate cache expiration times based on how frequently member data changes in your application
  * Implement cache invalidation when member data is updated



## Webhook Processing

Handle and respond to Memberstack events like member creation, plan changes, and more.

### Robust Webhook Handler

Implement a production-ready webhook handler with verification, idempotency, and error handling:

// routes/webhooks.js

const express = require('express');

const router = express.Router();

const memberstackAdmin = require('@memberstack/admin');

const memberstack = memberstackAdmin.init(process.env.MEMBERSTACK_SECRET_KEY);

// Optional: Database models for storing processed webhooks

const { ProcessedWebhook, Member } = require('../models');

// Webhook handler with verification and idempotency

router.post('/memberstack', express.json(), async (req, res) => {

try {

// 1. Verify the webhook signature

const isValid = memberstack.verifyWebhookSignature({

headers: req.headers,

secret: process.env.MEMBERSTACK_WEBHOOK_SECRET,

payload: req.body

});

if (!isValid) {

console.error('Invalid webhook signature');

return res.status(401).send('Invalid signature');

}

// 2. Check for duplicate webhooks (idempotency)

const webhookId = req.headers['ms-webhook-id'];

if (!webhookId) {

console.error('Missing webhook ID');

return res.status(400).send('Missing webhook ID');

}

// Check if we've already processed this webhook

const existingWebhook = await ProcessedWebhook.findOne({ webhookId });

if (existingWebhook) {

console.log(`Webhook ${webhookId} already processed, skipping`);

return res.status(200).send('Already processed');

}

// 3. Process the webhook based on event type

const { event, payload, timestamp } = req.body;

console.log(`Processing ${event} webhook`);

switch (event) {

case 'member.created':

await handleMemberCreated(payload);

break;

case 'member.updated':

await handleMemberUpdated(payload);

break;

case 'member.plan.created':

await handlePlanCreated(payload);

break;

case 'member.plan.canceled':

await handlePlanCanceled(payload);

break;

default:

console.log(`Unhandled event type: ${event}`);

}

// 4. Record that we've processed this webhook

await ProcessedWebhook.create({

webhookId,

event,

processedAt: new Date(),

payload

});

// 5. Respond with success

return res.status(200).send('Webhook processed successfully');

} catch (error) {

console.error('Webhook processing error:', error);

// Return 200 even on error to prevent Memberstack from retrying

// Log the error and handle it in your monitoring system

return res.status(200).send('Error processed');

}

});

// Webhook event handlers

async function handleMemberCreated(payload) {

// Example: Create the member in your database

await Member.create({

memberstackId: payload.id,

email: payload.auth.email,

customFields: payload.customFields,

createdAt: new Date()

});

// Example: Send welcome email

await sendWelcomeEmail(payload.auth.email);

}

async function handleMemberUpdated(payload) {

// Example: Update the member in your database

await Member.findOneAndUpdate(

{ memberstackId: payload.id },

{

email: payload.auth.email,

customFields: payload.customFields,

updatedAt: new Date()

}

);

}

async function handlePlanCreated(payload) {

// Example: Provision resources based on plan

const member = await Member.findOne({ memberstackId: payload.id });

const newPlan = payload.planConnections.find(plan => plan.status === 'ACTIVE');

if (member && newPlan) {

// Update member's plan in your database

member.plan = newPlan.planId;

member.planStatus = 'active';

await member.save();

// Provision resources based on plan

await provisionResources(member, newPlan.planId);

}

}

async function handlePlanCanceled(payload) {

// Example: Handle plan cancellation

const member = await Member.findOne({ memberstackId: payload.id });

const canceledPlan = payload.planConnections.find(plan => plan.status === 'CANCELED');

if (member && canceledPlan) {

// Update member's plan status in your database

member.planStatus = 'canceled';

await member.save();

// Schedule resource cleanup

await scheduleResourceCleanup(member, canceledPlan.planId);

}

}

module.exports = router;

⚠️ **Important:**

Production Webhook Tips:

  * Return 200 status even for errors you handle internally to prevent Memberstack from retrying webhooks unnecessarily
  * Implement a webhook storage system to track processed webhooks
  * Use a queue system (like RabbitMQ, AWS SQS, or Bull) for processing webhooks asynchronously
  * Set up monitoring and alerting for webhook processing failures



#### Webhook Event Types

Common events you might want to handle:

  * `member.created` \- New member signup
  * `member.updated` \- Member details updated
  * `member.deleted` \- Member deleted
  * `member.plan.created` \- Member added to a plan
  * `member.plan.updated` \- Plan status changed
  * `member.plan.canceled` \- Plan canceled



### Integration with External Systems

Use webhooks to synchronize member data with external systems like CRMs, email marketing platforms, or analytics tools:

// Example: Syncing member data with Mailchimp

async function syncWithMailchimp(member) {

const mailchimp = require('@mailchimp/mailchimp_marketing');

mailchimp.setConfig({

apiKey: process.env.MAILCHIMP_API_KEY,

server: process.env.MAILCHIMP_SERVER

});

try {

// Add or update subscriber

await mailchimp.lists.setListMember(

process.env.MAILCHIMP_LIST_ID,

md5(member.email.toLowerCase()),

{

email_address: member.email,

status_if_new: 'subscribed',

merge_fields: {

FNAME: member.customFields.firstName || '',

LNAME: member.customFields.lastName || ''

}

}

);

// Update tags based on plan

if (member.planConnections.some(p => p.planId === 'pln_premium' && p.status === 'ACTIVE')) {

await mailchimp.lists.updateListMemberTags(

process.env.MAILCHIMP_LIST_ID,

md5(member.email.toLowerCase()),

{

tags: [{ name: 'Premium', status: 'active' }]

}

);

}

console.log(`Synced member ${member.id} with Mailchimp`);

} catch (error) {

console.error('Mailchimp sync error:', error);

// Log to your error monitoring system

}

}

## Custom Backend Logic

Build specialized functionality with the Admin API to extend Memberstack's capabilities.

### Scheduled Member Management

Implement scheduled tasks for member management, such as checking for inactive members or sending renewal reminders:

// Example: Scheduled task to check for inactive members

// This could run as a cron job using node-cron or similar

const memberstackAdmin = require('@memberstack/admin');

const memberstack = memberstackAdmin.init(process.env.MEMBERSTACK_SECRET_KEY);

const cron = require('node-cron');

// Run every day at midnight

cron.schedule('0 0 * * *', async () => {

try {

console.log('Running inactive member check');

// Get all members

let allMembers = [];

let hasNextPage = true;

let after = null;

// Paginate through all members

while (hasNextPage) {

const result = await memberstack.members.list({

after,

limit: 50

});

allMembers = [...allMembers, ...result.data];

hasNextPage = result.hasNextPage;

after = result.endCursor;

}

// Check for members who haven't logged in for 60 days

const inactiveThreshold = new Date();

inactiveThreshold.setDate(inactiveThreshold.getDate() - 60);

const inactiveMembers = allMembers.filter(member => {

// Skip members without lastLogin (never logged in)

if (!member.lastLogin) return false;

const lastLogin = new Date(member.lastLogin);

return lastLogin < inactiveThreshold;

});

console.log(`Found ${inactiveMembers.length} inactive members`);

// Process inactive members (e.g., send re-engagement emails)

for (const member of inactiveMembers) {

await sendReengagementEmail(member);

}

console.log('Inactive member check completed');

} catch (error) {

console.error('Error in inactive member check:', error);

}

});

async function sendReengagementEmail(member) {

// Your email sending logic here

console.log(`Sending re-engagement email to ${member.auth.email}`);

}

### Bulk Member Operations

Perform bulk operations on members, such as updating multiple members with similar attributes:

// Example: Update all members with a specific custom field

async function updateMembersWithField(fieldName, oldValue, newValue) {

try {

console.log(`Updating members with ${fieldName} from "${oldValue}" to "${newValue}"`);

// Get all members

let allMembers = [];

let hasNextPage = true;

let after = null;

// Paginate through all members

while (hasNextPage) {

const result = await memberstack.members.list({

after,

limit: 50

});

allMembers = [...allMembers, ...result.data];

hasNextPage = result.hasNextPage;

after = result.endCursor;

}

// Filter members with the target field value

const membersToUpdate = allMembers.filter(member =>

member.customFields && member.customFields[fieldName] === oldValue

);

console.log(`Found ${membersToUpdate.length} members to update`);

// Update each member

let updateCount = 0;

for (const member of membersToUpdate) {

try {

// Create updated custom fields object

const customFields = {

...member.customFields,

[fieldName]: newValue

};

// Update the member

await memberstack.members.update({

id: member.id,

data: {

customFields

}

});

updateCount++;

// Add a small delay to avoid rate limits

await new Promise(resolve => setTimeout(resolve, 100));

} catch (error) {

console.error(`Error updating member ${member.id}:`, error);

}

}

console.log(`Successfully updated ${updateCount} members`);

return updateCount;

} catch (error) {

console.error('Bulk update error:', error);

throw error;

}

}

💡 **Tip:**

Bulk Operation Best Practices:

  * Add delays between API calls to avoid hitting rate limits
  * Implement error handling for individual member operations
  * Use batching for very large member sets
  * Consider running resource-intensive operations during off-peak hours
  * Always test bulk operations in sandbox mode first



### Custom Analytics and Reporting

Build custom analytics and reporting functionality based on member data:

// Example: Generate member growth report

async function generateMemberGrowthReport(startDate, endDate) {

try {

console.log(`Generating member growth report from ${startDate} to ${endDate}`);

// Get all members

let allMembers = [];

let hasNextPage = true;

let after = null;

// Paginate through all members

while (hasNextPage) {

const result = await memberstack.members.list({

after,

limit: 50

});

allMembers = [...allMembers, ...result.data];

hasNextPage = result.hasNextPage;

after = result.endCursor;

}

// Convert date strings to Date objects

const start = new Date(startDate);

const end = new Date(endDate);

// Initialize report data

const report = {

totalMembers: allMembers.length,

newMembers: 0,

byPlan: {},

bySource: {},

byDay: {}

};

// Initialize days

let currentDay = new Date(start);

while (currentDay <= end) {

const dayKey = currentDay.toISOString().split('T')[0];

report.byDay[dayKey] = 0;

currentDay.setDate(currentDay.getDate() + 1);

}

// Process members

for (const member of allMembers) {

const createdAt = new Date(member.createdAt);

// Check if member was created in date range

if (createdAt >= start && createdAt <= end) {

report.newMembers++;

// Group by day

const dayKey = createdAt.toISOString().split('T')[0];

report.byDay[dayKey] = (report.byDay[dayKey] || 0) + 1;

// Group by plan

if (member.planConnections && member.planConnections.length > 0) {

for (const plan of member.planConnections) {

if (plan.status === 'ACTIVE') {

report.byPlan[plan.planId] = (report.byPlan[plan.planId] || 0) + 1;

}

}

} else {

report.byPlan['no_plan'] = (report.byPlan['no_plan'] || 0) + 1;

}

// Group by source (if available as custom field)

const source = member.customFields?.source || 'unknown';

report.bySource[source] = (report.bySource[source] || 0) + 1;

}

}

return report;

} catch (error) {

console.error('Report generation error:', error);

throw error;

}

}

## Next Steps

Now that you've seen common use cases, you might want to explore:

  * [→ Member Actions (create, read, update, delete)](/admin-node-package/member-actions)
  * [→ Token and Webhook Verification](/admin-node-package/verification)
  * [→ Frequently Asked Questions](/admin-node-package/faqs)



## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
