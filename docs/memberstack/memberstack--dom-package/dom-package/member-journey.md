[ Memberstack Developers Documentation](/)

[](/)

Dom Package

  * [Quick Start](/dom-package/quick-start)

  * [Core Authentication](/dom-package/core-authentication)

  * [Member Journey](/dom-package/member-journey)

    * [Signup Options](/dom-package/member-journey#signup-options)
    * [Login Options](/dom-package/member-journey#login-options)
    * [Profile Management](/dom-package/member-journey#profile-management)
    * [Member JSON](/dom-package/member-journey#member-json)
    * [Data Tables](/dom-package/member-journey#data-tables)
    * [Protected Content](/dom-package/member-journey#protected-content)
    * [Password Management](/dom-package/member-journey#password-management)
  * [Plan Management](/dom-package/plan-management)

  * [Pre-built Modals](/dom-package/pre-built-modals)

  * [Advanced Integration](/dom-package/advanced-integration)

  * [Playground](/dom-package/playground)




### Audience: DOM SDK (JavaScript) Only

This guide targets developers using the `@memberstack/dom` package (or Webflow via `window.$memberstackDom`). If you are building with Data Attributes (Webflow/WordPress data-attribute integration), use the Data Attribute-specific documentation instead.

Note: The DOM SDK exposes programmatic methods; there are no data-attributes covered here.

# Member Journey

Welcome! This guide will show you how to create a complete membership experience using Memberstack. We'll walk through everything step-by-step, from letting people sign up to managing their accounts.

## Signup Options

Memberstack provides multiple ways for users to sign up: email/password registration, passwordless signup, and social provider authentication. For complete details on implementing each authentication method, see the [Core Authentication guide](/dom-package/core-authentication).

Here's an example of implementing email/password signup with custom fields:

<!-- Add this HTML to your signup page -->

<form id="signupForm">

<!-- Basic required fields -->

<input type="email" id="email" placeholder="Email" required />

<input type="password" id="password" placeholder="Password" required />

<!-- Custom fields to collect extra information -->

<input type="text" id="firstName" placeholder="First Name" required />

<input type="text" id="lastName" placeholder="Last Name" required />

<!-- Simple dropdown for user type -->

<select id="userType" required>

<option value="">I am a...</option>

<option value="designer">Designer</option>

<option value="developer">Developer</option>

<option value="other">Other</option>

</select>

<button type="submit">Create Account</button>

<div id="errorMessage" style="color: red; display: none;"></div>

</form>

// Add this JavaScript to handle the signup

document.getElementById('signupForm').addEventListener('submit', async (event) => {

event.preventDefault();

// Hide any previous error messages

const errorDiv = document.getElementById('errorMessage');

errorDiv.style.display = 'none';

// Get all the form values

const email = document.getElementById('email').value;

const password = document.getElementById('password').value;

const firstName = document.getElementById('firstName').value;

const lastName = document.getElementById('lastName').value;

const userType = document.getElementById('userType').value;

try {

// Try to create the new account

const member = await memberstack.signupMemberEmailPassword({

email: email,

password: password,

// Store additional information in customFields

customFields: {

firstName: firstName,

lastName: lastName,

userType: userType

}

});

// If successful, send them to the dashboard

window.location.href = '/dashboard';

} catch (error) {

// If something goes wrong, show the error message

errorDiv.textContent = error.message || 'Something went wrong. Please try again.';

errorDiv.style.display = 'block';

}

});

### Available Signup Methods

  * Email/password registration
  * Passwordless signup
  * Social providers (Google, GitHub, etc.)
  * All methods support custom fields for additional member data



For more authentication information, check the [Core Authentication guide](/dom-package/core-authentication).

## Login Options

Memberstack supports multiple authentication methods to give your users flexibility in how they log in. Each method can be implemented independently or combined to provide multiple login options.

### Available Login Methods

#### Email/Password Login

Traditional authentication with email and password credentials.

#### Passwordless Login

Secure authentication via email and 6-digit code, no password required.

#### Social Provider Login

Authentication through social platforms like Google, GitHub, and others.

For detailed instructions on implementing each login method, visit the [Core Authentication guide](/dom-package/core-authentication).

Here's an example implementing email/password and passwordless login:

// Add this HTML to your login page

<div class="login-options">

<!-- Email/Password Login Form \-->

<form id="loginForm">

<h3>Log in with Email</h3>

<input type="email" id="loginEmail" placeholder="Email" required />

<input type="password" id="loginPassword" placeholder="Password" required />

<button type="submit">Log In</button>

<div id="loginError" style="color: red; display: none;"></div>

</form>

<!-- Passwordless Login Option \-->

<div class="passwordless-section">

<h3>Login without Password</h3>

<form id="passwordlessForm">

<input type="email" id="passwordlessEmail" placeholder="Email" required />

<button type="submit">Send Login Token</button>

<div id="passwordlessMessage"></div>

</form>

</div>

</div>

// Add this JavaScript to handle both login methods

// 1. Email/Password Login

document.getElementById('loginForm').addEventListener('submit', async (event) => {

event.preventDefault();

const errorDiv = document.getElementById('loginError');

errorDiv.style.display = 'none';

try {

const member = await memberstack.loginMemberEmailPassword({

email: document.getElementById('loginEmail').value,

password: document.getElementById('loginPassword').value

});

window.location.href = '/dashboard';

} catch (error) {

errorDiv.textContent = error.message || 'Login failed. Please check your email and password.';

errorDiv.style.display = 'block';

}

});

// 2. Passwordless Login

document.getElementById('passwordlessForm').addEventListener('submit', async (event) => {

event.preventDefault();

const messageDiv = document.getElementById('passwordlessMessage');

const email = document.getElementById('passwordlessEmail').value;

try {

await memberstack.sendMemberLoginPasswordlessEmail({

email: email,

redirectUrl: window.location.origin + '/dashboard' // Where to send them after login

});

messageDiv.textContent = 'Check your email for a login token!';

messageDiv.style.color = 'green';

} catch (error) {

messageDiv.textContent = error.message || 'Could not send login token. Please try again.';

messageDiv.style.color = 'red';

}

});

### 💡 Pro Tips

  * Consider offering both login methods to give users choice
  * Add clear instructions for passwordless login
  * Make error messages helpful and friendly
  * Add a loading state while authentication happens



## Profile Management

Allow members to manage their profile information using Memberstack's custom fields. Note that while Memberstack can store URLs to files and images, you'll need to use a separate file storage service (like AWS S3, Cloudinary, etc.) to actually store the files themselves.

### Important Note About Files

Memberstack doesn't handle file storage directly. For profile pictures or other files:

  * Upload files to your chosen storage service
  * Store the resulting URL in a Memberstack custom field
  * Use the stored URL to display the image or file in your UI



Here's an example of managing profile information:

<!-- Add this HTML \-->

<form id="passwordForm">

<div>

<input 

type="password"

id="currentPassword"

placeholder="Current Password"

required 

/>

</div>

<div>

<input 

type="password"

id="newPassword"

placeholder="New Password"

required 

/>

<div id="passwordStrength"></div>

</div>

<button type="submit">Update Password</button>

<div id="message"></div>

</form>

// Add this JavaScript

document.getElementById('passwordForm').addEventListener('submit', async (event) => {

event.preventDefault();

const messageDiv = document.getElementById('message');

try {

await memberstack.updateMemberAuth({

currentPassword: document.getElementById('currentPassword').value,

newPassword: document.getElementById('newPassword').value

});

messageDiv.textContent = 'Password updated!';

messageDiv.style.color = 'green';

document.getElementById('passwordForm').reset();

} catch (error) {

messageDiv.textContent = error.message || 'Update failed. Please try again.';

messageDiv.style.color = 'red';

}

});

// Simple password strength check

document.getElementById('newPassword').addEventListener('input', (event) => {

const password = event.target.value;

const strengthDiv = document.getElementById('passwordStrength');

if (password.length < 8) {

strengthDiv.textContent = 'Too short';

strengthDiv.style.color = 'red';

} else if (/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) {

strengthDiv.textContent = 'Strong';

strengthDiv.style.color = 'green';

} else {

strengthDiv.textContent = 'Add numbers and letters';

strengthDiv.style.color = 'orange';

}

});

### Custom Fields Tips

  * All custom fields are stored as strings
  * Convert strings to other types as needed (e.g., parseInt for numbers)
  * For objects or arrays, use JSON.parse() on the stored string
  * Access custom fields through the member object
  * Updates are immediately available across your site



### String Conversion Examples

// Reading a number from a custom field

const age = parseInt(member.customFields.age);

// Reading a JSON object from a custom field

const preferences = JSON.parse(member.customFields.preferences);

// Storing a number in a custom field

await memberstack.updateMember({

customFields: {

age: age.toString() // Convert to string before storing

}

});

// Storing an object in a custom field

await memberstack.updateMember({

customFields: {

preferences: JSON.stringify(preferences) // Convert to string before storing

}

});

## Member JSON

Member JSON is a flexible storage system that allows you to associate custom data objects with each member in your app. Unlike custom fields which are predefined in your Memberstack dashboard, Member JSON allows you to store any valid JSON object without prior configuration.

### What Can You Store?

  * User preferences (theme, language, notifications)
  * App-specific settings and configurations
  * Custom metadata and tracking information
  * Application state that persists across sessions
  * Any structured data that doesn't fit into standard member fields



### Getting Member JSON Data

Use `getMemberJSON()` to retrieve the stored JSON data for the current member.

// Get the current member's JSON data

const { data } = await memberstack.getMemberJSON();

if (data?.json) {

console.log('User theme:', data.json.preferences?.theme);

console.log('Dashboard layout:', data.json.settings?.dashboardLayout);

console.log('Onboarding completed:', data.json.metadata?.onboardingCompleted);

} else {

console.log('No JSON data found for this member');

}

### Updating Member JSON Data

Use `updateMemberJSON()` to store new JSON data. Note that this method completely replaces the existing JSON data.

// Complete replacement of JSON data

await memberstack.updateMemberJSON({

json: {

preferences: {

theme: 'dark',

language: 'en',

notifications: true

},

settings: {

dashboardLayout: 'grid',

itemsPerPage: 25

}

}

});

// To merge with existing data, first fetch current data

const { data: current } = await memberstack.getMemberJSON();

const updatedJson = {

...current?.json,

preferences: {

...current?.json?.preferences,

theme: 'light' // Only update the theme

}

};

await memberstack.updateMemberJSON({ json: updatedJson });

### ⚠️ Important Note

`updateMemberJSON` completely replaces the existing JSON data - it does not merge with existing data. To preserve existing data while updating specific fields, first fetch the current JSON, modify it, then update.

### Common Use Cases

#### User Preferences Storage

Store UI preferences that persist across sessions:

// Save user preferences

await memberstack.updateMemberJSON({

json: {

ui: {

theme: 'dark',

sidebarCollapsed: true,

language: 'en',

timezone: 'America/New_York'

},

notifications: {

email: true,

push: false,

marketing: false

}

}

});

// Load preferences on app start

const { data } = await memberstack.getMemberJSON();

const preferences = data?.json?.ui;

if (preferences) {

applyTheme(preferences.theme);

setSidebarState(preferences.sidebarCollapsed);

setLanguage(preferences.language);

}

#### Progress Tracking and Onboarding

Store user progress and onboarding state:

await memberstack.updateMemberJSON({

json: {

onboarding: {

completed: false,

currentStep: 3,

completedSteps: [1, 2],

skippedSteps: [],

startedAt: '2024-01-15T10:30:00.000Z'

},

progress: {

profileCompletion: 0.75,

coursesCompleted: 5,

badgesEarned: ['first_login', 'profile_complete'],

lastActivity: new Date().toISOString()

}

}

});

#### Feature Flags and A/B Testing

Track feature access and testing participation:

const { data } = await memberstack.getMemberJSON();

const currentData = data?.json || {};

await memberstack.updateMemberJSON({

json: {

...currentData,

experiments: {

...currentData.experiments,

new_checkout_flow: {

variant: 'B',

enrolledAt: new Date().toISOString()

}

},

featureAccess: {

...currentData.featureAccess,

beta_dashboard: true,

advanced_analytics: false

}

}

});

### Best Practices

#### 1\. Structure Your Data

Organize your JSON with clear, consistent naming and logical grouping.

#### 2\. Handle Missing Data Gracefully

Always check for data existence and provide defaults: `const theme = preferences?.theme || 'light'`

#### 3\. Merge Don't Replace

Preserve existing data when updating specific fields by fetching current data first.

#### 4\. Keep It Lean

Avoid storing large amounts of data or frequently changing information.

### Integration with React

The React package provides a convenient hook that wraps the member JSON functionality:

import { useMemberstack } from '@memberstack/react';

function UserPreferences() {

const { memberJSON, updateMemberJSON } = useMemberstack();

const updateTheme = async (theme: string) => {

const updatedJson = {

...memberJSON,

preferences: {

...memberJSON?.preferences,

theme

}

};

await updateMemberJSON(updatedJson);

};

return (

<div>

<p>Current theme: {memberJSON?.preferences?.theme || 'default'}</p>

<button onClick={() => updateTheme('dark')}>Dark Theme</button>

<button onClick={() => updateTheme('light')}>Light Theme</button>

</div>

);

}

### Limitations and Security

  * Member JSON is tied to the authenticated member and cannot be accessed by other members
  * Data should not contain sensitive information like passwords or API keys
  * Keep objects reasonably sized for performance
  * Subject to standard API rate limits (200 requests per 30 seconds per IP)
  * Supports all standard JSON data types but not JavaScript-specific types
  * Both methods require an authenticated member session



## Data Tables

Data Tables provide a powerful system for storing and managing structured data with advanced querying capabilities, relationships, and access control. Unlike Member JSON which stores unstructured data per member, Data Tables are designed for structured, relational data that can be shared across your application.

### What Can You Build?

  * Content management systems (articles, posts, comments)
  * E-commerce catalogs (products, categories, reviews)
  * Directory systems (listings, profiles, contacts)
  * Project management tools (tasks, projects, teams)
  * Custom data structures with complex relationships



### ⚠️ Rate Limits

**Global:** 200 requests per 30 seconds per IP

**Reads:** 25 requests per second per IP

**Creates:** 10 requests per minute per IP

**Writes:** 30 requests per minute per IP

Reads apply to: GET /v1/data-tables, GET /v1/data-tables/:tableKey, POST /v1/data-records/query, GET /v1/data-records

### Feature Flag

If `DISABLE_DATA_TABLES` is truthy on the server, all routes return 503 with message: "Data table feature is temporarilly offline."

### Table Management

First, you'll need to understand what tables are available and their structure.

#### List All Tables

Get all available tables and their schemas:

// Get all available data tables

const { data } = await memberstack.getDataTables();

data.tables.forEach((table) => {

console.log(`Table: ${table.key} (${table.name})`);

console.log(`Records: ${table.recordCount}`);

console.log(`Fields: ${table.fields.length}`);

// List all fields

table.fields.forEach((field) => {

console.log(` - ${field.key}: ${field.type} ${field.required ? '(required)' : ''}`);

});

});

#### Get Single Table

Retrieve detailed information about a specific table:

// Get detailed table information

const { data } = await memberstack.getDataTable({

table: 'articles'

});

console.log('Table name:', data.name);

console.log('Record count:', data.recordCount);

console.log('Access rules:', {

create: data.createRule,

read: data.readRule,

update: data.updateRule,

delete: data.deleteRule

});

### Record Operations

Perform CRUD operations on individual records within your tables.

#### Create Records

Add new records to your tables:

// Create a new article record

const { data } = await memberstack.createDataRecord({

table: 'articles',

data: {

title: 'Getting Started with Data Tables',

content: 'Data Tables provide powerful structured data storage...',

published: true,

category: 'tutorial',

tags: ['beginners', 'data-tables', 'guide']

}

});

console.log('Created record:', data.id);

console.log('Created by:', data.createdByMemberId);

console.log('I own this record:', data.activeMemberOwnsIt);

#### Get Records

Retrieve individual records by ID:

// Get a specific record

const { data } = await memberstack.getDataRecord({

table: 'articles',

recordId: 'rec_abc123'

});

console.log('Article title:', data.data.title);

console.log('Published:', data.data.published);

console.log('Created:', data.createdAt);

#### Update Records

Modify existing records with partial updates:

// Update specific fields

await memberstack.updateDataRecord({

recordId: 'rec_abc123',

data: {

title: 'Updated: Getting Started with Data Tables',

published: true,

updatedAt: new Date().toISOString()

}

});

console.log('Record updated successfully');

#### Delete Records

Remove records from your tables:

// Delete a record

await memberstack.deleteDataRecord({

recordId: 'rec_abc123'

});

console.log('Record deleted successfully');

### Advanced Querying

Use powerful query capabilities to filter, sort, and paginate through your data.

#### Basic Queries

Filter and sort records with simple conditions:

// Query published articles, newest first

const { data } = await memberstack.queryDataRecords({

table: 'articles',

query: {

findMany: {

where: {

published: { equals: true }

},

orderBy: { createdAt: 'desc' },

take: 20

}

}

});

console.log('Found', data.records.length, 'published articles');

data.records.forEach((record) => {

console.log(`- ${record.data.title} (${record.createdAt})`);

});

#### Complex Filtering

Use advanced operators and compound conditions:

// Complex query with multiple conditions

const { data } = await memberstack.queryDataRecords({

table: 'articles',

query: {

findMany: {

where: {

AND: [

{ published: { equals: true } },

{

OR: [

{ category: { equals: 'tutorial' } },

{ category: { equals: 'guide' } }

]

},

{ title: { contains: 'Data Tables' } },

{ createdAt: { gt: '2024-01-01T00:00:00.000Z' } }

]

},

orderBy: { createdAt: 'desc' },

take: 10

}

}

});

console.log('Complex query results:', data.records.length);

#### Pagination

Handle large datasets with cursor-based pagination:

// First page

let { data } = await memberstack.queryDataRecords({

table: 'articles',

query: {

findMany: {

where: { published: { equals: true } },

orderBy: { createdAt: 'desc' },

take: 20

}

}

});

console.log('First page:', data.records.length, 'records');

console.log('Has more:', data.pagination.hasMore);

// Next page using cursor

if (data.pagination?.hasMore && data.pagination.endCursor) {

const nextPage = await memberstack.queryDataRecords({

table: 'articles',

query: {

findMany: {

where: { published: { equals: true } },

orderBy: { createdAt: 'desc' },

take: 20,

after: String(data.pagination.endCursor)

}

}

});

console.log('Next page:', nextPage.data.records.length, 'records');

}

#### Count Queries

Get total counts without retrieving all records:

// Get total count

const { data } = await memberstack.queryDataRecords({

table: 'articles',

query: {

findMany: {

where: { published: { equals: true } },

_count: true

}

}

});

console.log('Total published articles:', data._count);

### Relationships and Includes

Work with related data across tables using includes and relationship fields.

#### Simple Relationships

Include related records in your queries:

// Include author information with articles

const { data } = await memberstack.queryDataRecords({

table: 'articles',

query: {

findMany: {

where: { published: { equals: true } },

include: {

author: true, // REFERENCE field

postedBy: true // MEMBER_REFERENCE field

},

orderBy: { createdAt: 'desc' },

take: 10

}

}

});

data.records.forEach((article) => {

console.log(`Article: ${article.data.title}`);

console.log(`Author: ${article.data.author?.data.name}`);

console.log(`Posted by member: ${article.data.postedBy?.email}`);

});

#### Relationship Counts

Get counts of related records without loading them:

// Include relationship counts

const { data } = await memberstack.queryDataRecords({

table: 'articles',

query: {

findMany: {

where: { published: { equals: true } },

include: {

author: true,

_count: {

select: {

comments: true,

likes: true,

tags: true

}

}

},

take: 10

}

}

});

data.records.forEach((article) => {

console.log(`${article.data.title}:`);

console.log(` Comments: ${article._count.comments}`);

console.log(` Likes: ${article._count.likes}`);

console.log(` Tags: ${article._count.tags}`);

});

#### Many-to-many Includes (findUnique)

Use `findUnique` to include many relations with pagination:

// Include many-to-many relations with pagination via findUnique

const { data } = await memberstack.queryDataRecords({

table: 'articles',

query: {

findUnique: {

where: { id: 'rec_article_123' },

include: {

tags: { take: 10 }, // REFERENCE_MANY (records)

likedBy: { take: 25 } // MEMBER_REFERENCE_MANY (members)

}

}

}

});

// Tags pagination: cursor is numeric internalOrder

console.log('tags.hasMore:', data.record.data.tags.pagination.hasMore);

console.log('tags.endCursor:', data.record.data.tags.pagination.endCursor);

// likedBy pagination: cursor is ISO date string createdAt

console.log('likedBy.hasMore:', data.record.data.likedBy.pagination.hasMore);

console.log('likedBy.endCursor:', data.record.data.likedBy.pagination.endCursor);

In `findMany`, includes support only simple relations (REFERENCE, MEMBER_REFERENCE). Use `findUnique` for many relations (REFERENCE_MANY, MEMBER_REFERENCE_MANY). Nested includes are not supported.

#### Managing Relationships

Connect and disconnect related records:

// Add and remove tags from an article

await memberstack.updateDataRecord({

recordId: 'rec_article_123',

data: {

tags: {

connect: [

{ id: 'rec_tag_advanced' },

{ id: 'rec_tag_tutorial' }

],

disconnect: [

{ id: 'rec_tag_beginner' }

]

}

}

});

// Add current member to favorites

await memberstack.updateDataRecord({

recordId: 'rec_article_123',

data: {

favoritedBy: {

connect: [{ self: true }]

}

}

});

### Access Control

Data Tables enforce table-level access rules that determine who can create, read, update, and delete records.

#### Access Rule Types

  * **Create Rule:** Who can create new records in this table
  * **Read Rule:** Who can view records (filters applied automatically)
  * **Update Rule:** Who can modify existing records
  * **Delete Rule:** Who can remove records from the table



// Access rules are enforced automatically

try {

// This will only return records the current member can access

const { data } = await memberstack.queryDataRecords({

table: 'private_notes',

query: {

findMany: {

orderBy: { createdAt: 'desc' }

}

}

});

console.log('Accessible records:', data.records.length);

} catch (error) {

if (error.statusCode === 403) {

console.log('Access denied - insufficient permissions');

}

}

### Best Practices

#### 1\. Optimize Your Queries

  * Use specific filters to reduce data transfer
  * Implement pagination for large datasets
  * Use count queries when you only need totals
  * Prefer cursor-based pagination over skip/offset



#### 2\. Handle Relationships Efficiently

  * Use includes judiciously - only fetch what you need
  * Use relationship counts instead of loading full collections
  * Consider separate queries for complex relationship data



#### 3\. Respect Rate Limits

  * Batch operations when possible
  * Cache frequently accessed data
  * Implement exponential backoff for retries
  * Use count queries to avoid unnecessary data fetching



#### 4\. Error Handling

  * Always handle access control errors (403)
  * Implement proper validation for required fields
  * Handle network errors and retry appropriately



### Important Limitations

  * Many-to-many includes (REFERENCE_MANY, MEMBER_REFERENCE_MANY) only work with findUnique
  * Deep nested includes are not supported
  * Access rules are enforced automatically and cannot be overridden
  * Rate limits vary by operation type - plan your usage accordingly
  * Field uniqueness constraints are not returned in table schemas
  * BigInt values are converted to Numbers in responses
  * GET `/v1/data-records` supports only: `tableKey`, `createdAfter`, `createdBefore`, `sortBy`, `sortDirection`, `limit`, `after`. Use `queryDataRecords` for field-level filters and includes.



## Protected Content

There are several ways to protect content with Memberstack. The simplest approach is using getCurrentMember to securely display member-specific content. For page-level protection, the implementation will vary based on your framework.

### Simple Content Protection

The most straightforward way to show protected content is to use getCurrentMember and render based on the returned data:

// Simple protected content example

async function showMemberContent() {

try {

const member = await memberstack.getCurrentMember();

if (member) {

// Member is logged in, show their data

document.getElementById('memberName').textContent = member.customFields.name;

document.getElementById('memberPlan').textContent = member.planName;

// Check plan access

const hasPremium = member.plans.some(plan =>

plan.id === 'premium_plan_id' && plan.status === 'active'

);

// Show/hide premium content

document.getElementById('premiumContent').style.display =

hasPremium ? 'block' : 'none';

} else {

// Not logged in, show public content only

document.getElementById('publicContent').style.display = 'block';

}

} catch (error) {

console.error('Error:', error);

}

}

### Framework-Specific Page Protection

**Important Note:** While Memberstack works with any framework, we recommend consulting framework-specific resources or a [Memberstack Expert](https://www.memberstack.com/experts) for detailed implementation guidance in Sveltekit, Next.js, Vue/Nuxt, etc.

#### SvelteKit

Here's how to protect routes in SvelteKit using server-side hooks. This approach is secure and efficient since authentication checks happen before any page data is loaded.

### Implementation Files

You'll need to set up these files:

  * src/hooks.server.ts - Main authentication logic
  * src/app.d.ts - TypeScript definitions (optional)
  * src/routes/+layout.server.ts - Share auth data with all routes



Here's the main authentication hook implementation:

// src/hooks.server.ts

import { redirect } from '@sveltejs/kit';

import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {

const path = event.url.pathname;

// Define public and protected paths

const publicPaths = ['/login', '/signup', '/reset-password'];

const protectedPaths = ['/dashboard', '/settings', '/profile'];

// Skip auth check for public paths

if (publicPaths.some(p => path.startsWith(p))) {

return await resolve(event);

}

// Check if current path is protected

if (protectedPaths.some(p => path.startsWith(p))) {

try {

const member = await memberstack.getCurrentMember();

if (!member) {

throw redirect(303, '/login');

}

// Add member to event.locals

event.locals.member = member;

} catch (error) {

console.error('Auth check failed:', error);

throw redirect(303, '/login');

}

}

return await resolve(event);

};

### TypeScript Support

Add these types to src/app.d.ts for better TypeScript support:

// src/app.d.ts

declare global {

namespace App {

interface Locals {

member: {

id: string;

email: string;

// Add other member properties

} | null;

}

}

}

### Accessing Member Data in Routes

After setting up the hook, you can access the member data in any server load function:

// src/routes/dashboard/+page.server.ts

import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {

// Member is already checked in hooks.server.ts

return {

member: locals.member

};

}) satisfies PageServerLoad;

### Key Benefits

  * Centralized authentication logic in one place
  * Server-side protection for better security
  * Early redirects before page data is loaded
  * TypeScript support for better development experience
  * Easy to maintain and update protected routes list



#### Next.js

Next.js offers two approaches to routing: the App Router (modern) and Pages Router (legacy). Here's how to implement authentication in both:

### Implementation Files

You'll need to set up these files:

  * middleware.ts - Global authentication middleware (App Router)
  * types/next-auth.d.ts - TypeScript definitions (optional)
  * components/AuthProvider.tsx - Auth context for client components



Here's how to protect routes using the modern App Router approach:

// middleware.ts

import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {

// Define protected paths

const protectedPaths = ['/dashboard', '/settings', '/profile'];

const path = request.nextUrl.pathname;

// Skip auth check for public paths

if (!protectedPaths.some(p => path.startsWith(p))) {

return NextResponse.next();

}

try {

// Get member token from cookies

const token = request.cookies.get('memberstack')?.value;

if (!token) {

return NextResponse.redirect(new URL('/login', request.url));

}

return NextResponse.next();

} catch (error) {

console.error('Auth middleware error:', error);

return NextResponse.redirect(new URL('/login', request.url));

}

}

// Configure which paths the middleware runs on

export const config = {

matcher: [

'/dashboard/:path*',

'/settings/:path*',

'/profile/:path*'

],

};

### TypeScript Support

Add these types for better TypeScript support:

// types/next-auth.d.ts

declare module 'next-auth' {

interface User {

id: string;

email: string;

customFields?: Record<string, string>;

}

}

declare module 'next' {

interface Request {

member?: {

id: string;

email: string;

customFields?: Record<string, string>;

}

}

}

For older projects using the Pages Router, use getServerSideProps:

// pages/protected.js

export async function getServerSideProps({ req }) {

// Initialize Memberstack

const memberstack = memberstackDOM.init({

publicKey: process.env.NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY,

useCookies: true

});

try {

const member = await memberstack.getCurrentMember();

if (!member) {

return {

redirect: {

destination: '/login',

permanent: false,

},

}

}

// Important: Serialize the member object for SSR

return {

props: {

member: JSON.parse(JSON.stringify(member))

}

}

} catch (error) {

console.error('Auth check failed:', error);

return {

redirect: {

destination: '/login',

permanent: false,

},

}

}

}

### Important Notes

  * Always serialize member data in getServerSideProps using JSON.parse(JSON.stringify())
  * Use middleware for App Router and getServerSideProps for Pages Router
  * Remember to handle both client and server-side authentication states
  * Consider using an AuthProvider component for sharing auth state



Here's a helpful AuthProvider component for managing auth state:

// components/AuthProvider.tsx

'use client'

import { createContext, useContext, useEffect, useState } from 'react'

import memberstackDOM from "@memberstack/dom"

const AuthContext = createContext({

member: null,

isLoading: true,

memberstack: null

})

export function AuthProvider({ children }) {

const [member, setMember] = useState(null)

const [isLoading, setIsLoading] = useState(true)

const [memberstack, setMemberstack] = useState(null)

useEffect(() => {

const ms = memberstackDOM.init({

publicKey: process.env.NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY,

useCookies: true

})

setMemberstack(ms)

const unsubscribe = ms.onAuthChange((member) => {

setMember(member)

setIsLoading(false)

})

return () => unsubscribe()

}, [])

return (

<AuthContext.Provider value={{ member, isLoading, memberstack }}>

{children}

</AuthContext.Provider>

)

}

// Helper hook to use auth context

export const useAuth = () => useContext(AuthContext)

### App Router Benefits

  * Middleware runs before page loads
  * Better performance with streaming
  * Server Components by default
  * Simpler data fetching



### Pages Router Benefits

  * Simpler mental model
  * More examples available
  * Better backward compatibility
  * Stable API surface



#### Vue/Nuxt

For Vue and Nuxt applications, authentication is handled through middleware and composables:

// composables/useAuth.ts

const useAuth = () => {

const member = ref(null)

const isLoading = ref(true)

const memberstack = memberstackDOM.init({

publicKey: import.meta.env.VITE_MEMBERSTACK_PUBLIC_KEY,

useCookies: true

})

onMounted(() => {

memberstack.onAuthChange((newMember) => {

member.value = newMember

isLoading.value = false

})

})

return { member, isLoading, memberstack }

}

Implement the authentication middleware:

// middleware/auth.ts

export default defineNuxtRouteMiddleware(async (to) => {

// Skip for public routes

const publicRoutes = ['/login', '/signup', '/reset-password']

if (publicRoutes.includes(to.path)) return

const { memberstack } = useAuth()

try {

const member = await memberstack.getCurrentMember()

if (!member) {

sessionStorage.setItem('redirectPath', to.fullPath)

return navigateTo('/login')

}

} catch (error) {

console.error('Auth check failed:', error)

return navigateTo('/login')

}

})

### Implementation Notes

  * Store auth state in a composable for reusability
  * Use middleware to protect routes automatically
  * Remember redirect paths for better UX
  * Handle auth errors gracefully



### Best Practices

  * Use getCurrentMember for simple content protection - it's secure and easy to implement
  * Implement proper loading states while checking member status
  * Consider framework-specific protection for entire pages
  * Always validate access client-side AND server-side for sensitive operations
  * Show clear messages when access is denied



## Password Management

Help members change their passwords securely. This code creates a password update form with strength checking and helpful feedback.

<!-- Add this HTML to your password management page -->

<form id="passwordForm">

<!-- Current password is needed for security -->

<div class="password-field">

<label for="currentPassword">Current Password</label>

<input 

type="password"

id="currentPassword"

required 

placeholder="Enter your current password"

/>

</div>

<!-- New password section -->

<div class="password-field">

<label for="newPassword">New Password</label>

<input 

type="password"

id="newPassword"

required 

placeholder="Enter your new password"

/>

<!-- This will show how strong the password is -->

<div id="passwordStrength"></div>

</div>

<!-- Confirm new password -->

<div class="password-field">

<label for="confirmPassword">Confirm New Password</label>

<input 

type="password"

id="confirmPassword"

required 

placeholder="Enter your new password again"

/>

</div>

<button type="submit">Update Password</button>

<div id="passwordMessage"></div>

</form>

// Add this JavaScript to handle password updates

document.getElementById('passwordForm').addEventListener('submit', async (event) => {

event.preventDefault();

const messageDiv = document.getElementById('passwordMessage');

// Get the password values

const currentPassword = document.getElementById('currentPassword').value;

const newPassword = document.getElementById('newPassword').value;

const confirmPassword = document.getElementById('confirmPassword').value;

// Make sure the new passwords match

if (newPassword !== confirmPassword) {

messageDiv.textContent = 'New passwords do not match';

messageDiv.style.color = 'red';

return;

}

try {

// Try to update the password

await memberstack.updateMemberAuth({

currentPassword: currentPassword,

newPassword: newPassword

});

// If successful, show a message and clear the form

messageDiv.textContent = 'Password updated successfully!';

messageDiv.style.color = 'green';

document.getElementById('passwordForm').reset();

} catch (error) {

messageDiv.textContent = error.message || 'Could not update password. Please try again.';

messageDiv.style.color = 'red';

}

});

// Add this to check password strength as they type

document.getElementById('newPassword').addEventListener('input', (event) => {

const password = event.target.value;

const strengthDiv = document.getElementById('passwordStrength');

// Check how strong the password is

let strength = 'Weak';

let color = 'red';

if (password.length >= 8) {

const hasLetter = /[a-zA-Z]/.test(password);

const hasNumber = /[0-9]/.test(password);

const hasSymbol = /[^a-zA-Z0-9]/.test(password);

if (hasLetter && hasNumber && hasSymbol) {

strength = 'Strong';

color = 'green';

} else if (hasLetter && (hasNumber || hasSymbol)) {

strength = 'Medium';

color = 'orange';

}

}

// Show the strength

strengthDiv.textContent = `Password Strength: ${strength}`;

strengthDiv.style.color = color;

});

### Making Passwords Secure

  * Require the current password for security
  * Check that new passwords match
  * Show password strength in real-time
  * Provide clear feedback on requirements
  * Confirm successful updates



## What's Next?

Now that you've set up the basics, you might want to explore:

  * [→ Setting Up Membership Plans](/dom-package/plan-management)
  * [→ Using Pre-built Modal Components](/dom-package/pre-built-modals)
  * [→ Advanced Memberstack Integration](/dom-package/advanced-integration)



## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
