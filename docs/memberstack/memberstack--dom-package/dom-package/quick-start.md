[ Memberstack Developers Documentation](/)

[](/)

Dom Package

  * [Quick Start](/dom-package/quick-start)

    * [Installation & Setup](/dom-package/quick-start#installation-setup)
    * [Basic Configuration](/dom-package/quick-start#basic-configuration)
    * [Framework Integration](/dom-package/quick-start#framework-integration)
    * [First Authentication Flow](/dom-package/quick-start#first-authentication-flow)
    * [Test Mode vs Live Mode](/dom-package/quick-start#test-mode-vs-live-mode)
  * [Core Authentication](/dom-package/core-authentication)

  * [Member Journey](/dom-package/member-journey)

  * [Plan Management](/dom-package/plan-management)

  * [Pre-built Modals](/dom-package/pre-built-modals)

  * [Advanced Integration](/dom-package/advanced-integration)

  * [Playground](/dom-package/playground)




# DOM Package Quick Start Guide

Welcome to Memberstack! This guide will help you add authentication and membership features to your website. Don't worry if you're new to coding - we'll walk you through each step.

By the end of this guide, you'll have:

  * Memberstack installed on your website
  * A working signup and login system
  * The ability to check if users are logged in



## Installation & Setup

First, you'll need to install the Memberstack package from a package manager like npm or yarn. Open your terminal in your project folder and run one of these commands:

npm install @memberstack/dom

\- or -

yarn add @memberstack/dom

After installation, you'll need to import Memberstack in your main JavaScript file:

import memberstackDOM from "@memberstack/dom";

💡 **Tip:**

If you're using a framework like React or Vue, this usually goes in your main app file (like `App.js` or `main.js`).

## Basic Configuration

Next, you'll need to initialize Memberstack with your credentials. You can find these in your Memberstack dashboard.

const memberstack = memberstackDOM.init({

publicKey: "YOUR_PUBLIC_KEY", // Find this in your Memberstack dashboard

useCookies: true // Optional

});

⚠️ **Important:**

  * Your public key is in your Memberstack dashboard under "Settings > Application > Memberstack App ID"
  * We recommend enabling cookies for the best user experience



## Framework Integration

If you're using a modern framework, here's how to integrate Memberstack properly with your application:

### React

Initialize Memberstack in your main component:

import { useEffect } from 'react';

import memberstackDOM from "@memberstack/dom";

function App() {

useEffect(() => {

const memberstack = memberstackDOM.init({

publicKey: "YOUR_PUBLIC_KEY",

useCookies: true

});

return () => {

// Cleanup if needed

};

}, []);

return <div>Your app content</div>;

}

### Svelte

Add Memberstack to your root layout:

<script>

import { onMount } from 'svelte';

import memberstackDOM from "@memberstack/dom";

onMount(() => {

const memberstack = memberstackDOM.init({

publicKey: "YOUR_PUBLIC_KEY",

useCookies: true

});

});

</script>

<slot />

### Vue

Initialize in your main app component:

<script setup>

import { onMounted } from 'vue'

import memberstackDOM from "@memberstack/dom"

onMounted(() => {

const memberstack = memberstackDOM.init({

publicKey: "YOUR_PUBLIC_KEY",

useCookies: true

});

});

</script>

<template>

<div>Your app content</div>

</template>

💡 **Tip:**

  * For Next.js, SvelteKit, or Nuxt, ensure initialization happens on the client side only
  * The initialization should be in a root-level component that persists across page changes



## First Authentication Flow

Let's create your first signup flow! This example shows how to add a simple signup button and handle the signup process:

// Add this button to your signup page

<button onclick="handleSignup()">Sign Up</button>

// Add this JavaScript to handle the signup

async function handleSignup() {

try {

const member = await memberstack.signupMemberEmailPassword({

email: "user@example.com", // Get this from your form

password: "securepassword123", // Get this from your form

});

// Redirect after successful signup

window.location.href = "/dashboard";

} catch (error) {

// Show error message to user

alert("Signup failed. Please try again.");

}

}

💡 **Tip:**

Memberstack also provides pre-built modals for signup and login - check out our [Modal Components](/dom-package/pre-built-modals) page to save development time!

## Test Mode vs Live Mode

Memberstack provides two operating modes: Test/Sandbox Mode and Live Mode. Understanding the difference is crucial for development and deployment.

### Test Mode

  * Public key starts with `pk_sb_`
  * Limited to 50 test members
  * Test members can be deleted to free up space
  * Use Stripe test cards for payments: 
    * Success: 4242 4242 4242 4242
    * Decline: 4000 0000 0000 0002
  * Perfect for development and testing



### Live Mode

  * Public key starts with `pk_`
  * No member limits
  * Processes real payments
  * Use for production environment



### ⚠️ Important Considerations

  * Always start development in Test Mode
  * When switching to Live Mode: 
    * Update your public key in all environments
    * Check automation tools (Zapier, Make, etc.) for the old test mode key
    * Update any environment variables or configuration files
    * Test the entire user flow again with the live key
  * Keep test and live mode keys separate - never mix them



### 💡 Development Tips

  * Create a separate test environment with its own configuration
  * Use environment variables to manage different keys
  * Document which integrations need key updates when switching modes
  * Create a deployment checklist for mode switching



## What's Next?

Now that you have the basics set up, you might want to:

  * [Add login functionality](/dom-package/member-journey#login-options)
  * [Add social login (Google, Facebook, etc.)](/dom-package/core-authentication#social-provider-flow)
  * [Create members-only content](/dom-package/member-journey#protected-content)



Check out our other guides in the sidebar to learn more about these features!

## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
