[ Memberstack Developers Documentation](/)

[](/)

Dom Package

  * [Quick Start](/dom-package/quick-start)

  * [Core Authentication](/dom-package/core-authentication)

  * [Member Journey](/dom-package/member-journey)

  * [Plan Management](/dom-package/plan-management)

  * [Pre-built Modals](/dom-package/pre-built-modals)

  * [Advanced Integration](/dom-package/advanced-integration)

  * [Playground](/dom-package/playground)

    * [Authentication](/dom-package/playground#authentication)
    * [Pre-built Modals](/dom-package/playground#pre-built-modals)
    * [Profile Management](/dom-package/playground#profile-management)
    * [Plan Management](/dom-package/playground#plan-management)
    * [Data Tables](/dom-package/playground#data-tables)
    * [Other Methods](/dom-package/playground#other-methods)
    * [FAQs](/dom-package/playground#faqs)



# Memberstack Playground

Welcome to the Memberstack Playground! This interactive environment lets you test Memberstack DOM package features using your public key. Try out different methods and see how they work in real-time.

## Initialize Memberstack

Enter your public key to initialize the Memberstack DOM package. This will enable the "Run Code" buttons.

Public Key (starts with pk_sb_ for test mode)

Initialize

### Audience: DOM SDK (JavaScript) Only

This playground targets developers using the `@memberstack/dom` package (or Webflow via `window.$memberstackDom`). If you're building with Data Attributes (Webflow/WordPress data-attribute integration), refer to the Data Attribute documentation instead.

These examples use programmatic methods, not data-attributes.

## Memberstack DOM Package

AI Reference Documentation

## Authentication

This section covers user authentication, including signup, login, logout, and handling authentication state changes.

## 

### Methods:

### Signup Member (Email/Password)

Signs up a new member using email and password.

### Login Member (Email/Password)

Logs in an existing member with email and password.

### Logout Member

Logs out the currently authenticated member.

### Signup with Provider

Initiates the signup process using a third-party provider (e.g., Google, Facebook).

### Login with Provider

Initiates the login process using a third-party provider.

### Send Passwordless Login Email

Sends a passwordless login email to the specified email address.

### Send Passwordless Signup Email

Sends a passwordless signup email to the specified email address.

### Login with Passwordless Token

Logs in a member using a passwordless token received via email.

### Signup with Passwordless Token

Signs up a new member using a passwordless token received via email.

### On Authentication Change

Listens for changes in the member's authentication state.

### Get Member Cookie

Retrieves the current member's authentication cookie.

### Send Verification Email

Sends an email verification email to the currently logged-in member.

## Pre-built Modals

This section demonstrates how to use Memberstack's pre-built modals for common authentication and profile management actions.

### Methods:

### Open Modal

Opens a pre-built Memberstack modal.

### Hide Modal

Closes the currently open Memberstack modal.

## Profile Management

This section covers methods for managing the current member's profile, including updating custom fields, and changing passwords.

### Methods:

### Get Current Member

Retrieves the currently logged-in member's data.

### Update Member

Updates the current member's profile data (custom fields).

### Delete Member

Deletes the current member's account and cancels any active subscriptions.

### Update Member Authentication

Updates the current member's authentication details (email, password).

### Update Member JSON

Stores or updates JSON data for the current member. Completely replaces existing data.

### Get Member JSON

Retrieves the current member's JSON data for user preferences, settings, and custom metadata.

### Send Password Reset Email

Sends a password reset email to the specified email address.

### Reset Member Password

Resets a member's password using a reset token sent to a member.

### Connect Provider

Connects a third-party provider (e.g., Google, Facebook) to the current member's account.

### Disconnect Provider

Disconnects a third-party provider from the current member's account.

### Update Member Profile Image

Updates the current member's profile image.

## Plan Management

This section covers methods for managing the current member's plans, including adding, removing, and purchasing plans.

### Get Plan

Retrieves information about a specific plan.

### Get Plans

Retrieves a list of all available plans.

### Add Plan

Adds a plan to the current member's account.

### Remove Plan

Removes a plan from the current member's account.

### Purchase Plans with Checkout

Initiates a Stripe Checkout session to purchase plans.

### Launch Stripe Customer Portal

Launches the Stripe customer portal for managing subscriptions and billing.

### Tips for Testing Plans

  * For paid plans, use test card 4242 4242 4242 4242
  * Free plans use planId, paid plans use priceId
  * Check the Memberstack dashboard for your actual IDs



## Data Tables

This section demonstrates Data Tables functionality for storing and managing structured data with powerful querying capabilities, relationships, and access control.

### ⚠️ Rate Limits for Data Tables

  * **Global:** 200 requests per 30 seconds per IP
  * **Reads:** 25 requests per second per IP (GET/query operations)
  * **Creates:** 10 requests per minute per IP (POST operations)
  * **Writes:** 30 requests per minute per IP (PUT/DELETE operations)



Reads apply to: GET /v1/data-tables, GET /v1/data-tables/:tableKey, POST /v1/data-records/query, GET /v1/data-records

### Feature Flag

If `DISABLE_DATA_TABLES` is truthy on the server, all routes return 503 with message: "Data table feature is temporarilly offline."

### Tips for Testing Data Tables

  * Create test tables in your Memberstack dashboard first
  * Use realistic test data for better understanding
  * Check access rules - some operations may require authentication
  * Use table keys (not IDs) in your requests
  * Record IDs start with 'rec_' prefix



### Methods:

### Get Data Tables

Retrieve all available data tables and their schemas.

### Get Data Table

Retrieve detailed information about a specific data table.

### Create Data Record

Create a new record in a data table.

### Get Data Record

Retrieve a specific record by ID from a data table.

### Update Data Record

Update specific fields in an existing data record.

### Delete Data Record

Delete a specific record from a data table.

### Query Data Records

Perform advanced queries with filtering, sorting, pagination, and includes.

## Other Methods

This section covers miscellaneous methods and utilities.

### Get Secure Content (Hosted Content)

Retrieves secure content based on hosted content ID.

### Set Password

Sets a new password for the current member.

## FAQs

Here are some common questions and answers about using Memberstack in your projects:

How do I get my Memberstack public key?

What are custom fields and how do I use them?

How do I integrate Memberstack with my existing website?

Why don't I see any team methods in the Memberstack API documentation?

What are the different authentication methods supported by Memberstack?

How do I handle errors returned by the Memberstack API?

How do I redirect users after login or signup?

How do I use Memberstack with a static site generator?

Can I use Memberstack with a single-page application (SPA)?

How do I customize the appearance of Memberstack's pre-built modals?

### Additional Tips

  * Use test mode keys (starting with pk_sb_) for development
  * Remember to handle errors in your code
  * Check the console for additional debugging information
  * Replace placeholder IDs with your actual plan and price IDs



### Test Accounts

  * Create test accounts with fake email addresses (e.g., test@example.com)
  * Use secure but memorable passwords for testing
  * Test mode allows up to 50 test members
  * Test members can be deleted to free up space



## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
