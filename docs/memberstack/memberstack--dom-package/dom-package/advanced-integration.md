[ Memberstack Developers Documentation](/)

[](/)

Dom Package

  * [Quick Start](/dom-package/quick-start)

  * [Core Authentication](/dom-package/core-authentication)

  * [Member Journey](/dom-package/member-journey)

  * [Plan Management](/dom-package/plan-management)

  * [Pre-built Modals](/dom-package/pre-built-modals)

  * [Advanced Integration](/dom-package/advanced-integration)

    * [Webhooks](/dom-package/advanced-integration#webhooks)
    * [Custom Authentication](/dom-package/advanced-integration#custom-authentication)
    * [Available Packages](/dom-package/advanced-integration#available-packages)
  * [Playground](/dom-package/playground)




# Advanced Integration

This guide covers advanced integration features of Memberstack, including webhooks, custom authentication flows, and API endpoints. These features allow you to build sophisticated membership experiences and integrate deeply with your existing systems.

### Before You Start

  * Complete the [Quick Start Guide](/dom-package/quick-start)
  * Familiarize yourself with the Memberstack dashboard
  * Have a paid Memberstack plan for production use



## Webhooks

While webhooks are not directly part of the DOM package, they work seamlessly with it to help you respond to member-related events in your application. Webhooks allow you to listen for events like member creation, updates, and plan changes.

### Available Events

Member Events:

  * member.created - When a new member signs up
  * member.updated - When member data changes
  * member.deleted - When a member is removed



Plan Events:

  * member.plan.created - When a member gets a new plan
  * member.plan.updated - When a plan status changes
  * member.plan.canceled - When a plan is canceled



### Setting Up Webhooks

  1. Go to the Memberstack dashboard
  2. Navigate to DevTools
  3. Enable webhooks and add your endpoint URL
  4. Select the events you want to receive
  5. Copy your webhook secret for verification



### Example Webhook Payload

{

"event": "member.created",

"timestamp": 1633486880169,

"payload": {

"id": "mem_...",

"auth": {

"email": "john@example.com"

},

"metaData": {},

"customFields": {}

}

}

## Custom Authentication

Memberstack supports custom authentication flows through its OpenID Connect integration. This allows you to use Memberstack as an identity provider for your applications while maintaining full control over the authentication experience.

### Getting Started with SSO

  1. Enable SSO in your Memberstack dashboard
  2. Create a new SSO integration
  3. Configure your client ID and secret
  4. Set up your redirect URIs
  5. Implement the OpenID Connect flow



### OpenID Configuration

// OpenID Connect configuration endpoints

const config = {

discoveryUrl: "https://auth.memberstack.com/.well-known/openid-configuration",

authorizationEndpoint: "https://auth.memberstack.com/authorize",

tokenEndpoint: "https://auth.memberstack.com/token",

jwksEndpoint: "https://auth.memberstack.com/jwks"

};

## Available Packages

While Memberstack doesn't provide traditional API endpoints, it offers several packages for different environments that allow you to extend and customize your Memberstack integration.

### Admin Package

For backend operations and server-side validation

  * Verify JWT tokens
  * Validate webhook signatures
  * Manage members server-side



### Other Packages

For front-end integrations and client-side operations

  * DOM Package (this documentation)
  * Data Attribute Package (Webflow & Wordpress)



### Using the Admin Package

// Example using the Admin Package

import { MemberstackAdmin } from "@memberstack/admin";

const admin = new MemberstackAdmin({

apiKey: "YOUR_SECRET_KEY"

});

// Verify a member's JWT token

const isValid = await admin.verifyToken(token);

// Access member data securely

if (isValid) {

const member = await admin.getMember(memberId);

console.log("Member data:", member);

}

### Package Selection Guide

  * **DOM Package:** Client-side member management and authentication
  * **Admin Package:** Server-side only operations and security validation
  * **Data Attribute Package:** Wrapper around the DOM package that adds data attributes



## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
