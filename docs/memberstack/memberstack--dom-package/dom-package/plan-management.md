[ Memberstack Developers Documentation](/)

[](/)

Dom Package

  * [Quick Start](/dom-package/quick-start)

  * [Core Authentication](/dom-package/core-authentication)

  * [Member Journey](/dom-package/member-journey)

  * [Plan Management](/dom-package/plan-management)

    * [Free Plans](/dom-package/plan-management#free-plans)
    * [Paid Plans](/dom-package/plan-management#paid-plans)
    * [Plan Purchase Flow](/dom-package/plan-management#plan-purchase-flow)
  * [Pre-built Modals](/dom-package/pre-built-modals)

  * [Advanced Integration](/dom-package/advanced-integration)

  * [Playground](/dom-package/playground)




## Plan Management

This guide covers everything you need to know about implementing and managing membership plans with Memberstack. All paid plans are processed through Stripe, ensuring secure and reliable payments.

### Before You Start

Create and configure your plans in the Memberstack dashboard under "Plans" before implementing them in your code. Important:

  * Free plans use **Plan IDs** (starts with "pln_")
  * Paid plans use **Price IDs** (starts with "prc_")
  * Connect your Stripe account for paid plans
  * Create plans in the dashboard (Plans → New Plan)



### Testing Your Plans

To test your plans without real charges:

  * Enable test mode in your Memberstack DevTools, then copy your public key (it starts with "pk_sb_").
  * Test mode has its own set of Plan IDs and Price IDs - make sure to use the correct ones
  * Use Stripe's test card: 4242 4242 4242 4242 (exp: any future date, CVC: any 3 digits)
  * Remember to switch back to live mode and update IDs for production



## Free Plans

Free plans are a great way to offer basic access to your platform or provide a trial experience. They can be implemented without Stripe integration.

### Fetching Available Plans

First, let's see how to retrieve all available plans:

// Get available plans

async function getAvailablePlans() {

try {

return await memberstack.getPlans();

} catch (error) {

console.error("Couldn't get plans:", error);

return [];

}

}

### Adding a Free Plan

Here's how to create a free plan signup button and handle enrollment:

// Add this HTML

<button onclick="startFreePlan()">Get Free Plan</button>

// Add this JavaScript

async function startFreePlan() {

try {

// Get the current member

const member = await memberstack.getCurrentMember();

if (!member) {

// Not logged in - show signup with free plan

await memberstack.openModal("SIGNUP", {

planId: "YOUR_FREE_PLAN_ID"

});

} else {

// Logged in - add free plan

await memberstack.addPlan({

planId: "YOUR_FREE_PLAN_ID"

});

// Go to dashboard after success

window.location.href = "/dashboard";

}

} catch (error) {

alert("Couldn't add free plan. Please try again.");

}

}

### Free Plan Tips

  * Make sure to clearly list what's included in the free plan
  * Consider adding a trial of paid features to free plans
  * Show comparison tables to encourage upgrades
  * Test the signup flow both logged in and logged out



## Paid Plans

Paid plans use Stripe for secure payment processing. Before implementing paid plans, make sure you've connected Stripe in your Memberstack dashboard and created your plans.

You can read more about the Stripe Customer Portal configuration [here](https://docs.stripe.com/api/customer_portal/configurations/object).

### Adding a Paid Plan

Here's how to create a paid plan button and handle Stripe checkout:

// Add this HTML

<button onclick="startPaidPlan()">Get Pro Plan</button>

// Add this JavaScript

async function startPaidPlan() {

try {

const member = await memberstack.getCurrentMember();

if (!member) {

// Not logged in - show signup

await memberstack.openModal("SIGNUP", {

priceId: "prc_YOUR_PRICE_ID"

});

} else {

// Start checkout

const checkout = await memberstack.purchasePlansWithCheckout({

priceId: "prc_YOUR_PRICE_ID",

successUrl: window.location.origin + "/dashboard",

cancelUrl: window.location.origin + "/plans",

configuration: {

// Optional: customize checkout settings

subscription_cancel: {

enabled: true

}

}

});

// Go to checkout

window.location.href = checkout.url;

}

} catch (error) {

alert("Couldn't start checkout. Please try again.");

}

}

### Required Setup

  * Connected Stripe account
  * Plans created in dashboard
  * Test mode for development
  * Plan IDs copied and ready



### Plan Settings

  * Set prices and billing cycles
  * Define included features
  * Configure trial periods
  * Set member limits if needed



## Plan Purchase Flow

Here's how to handle common plan management tasks like checking access, upgrades, and letting members manage their subscriptions:

// Check if member has a specific plan

async function hasPlan(planId) {

const member = await memberstack.getCurrentMember();

if (!member) return false;

return member.plans.some(plan =>

plan.id === planId &&

plan.status === "active"

);

}

// Open billing portal for subscription management

async function openBilling() {

try {

const portal = await memberstack.launchStripeCustomerPortal({

redirectUrl: window.location.origin + "/account"

});

window.location.href = portal.url;

} catch (error) {

alert("Couldn't open billing. Please try again.");

}

}

### Common Questions

What's the difference between Plan IDs and Price IDs?

Free plans use Plan IDs (starts with "pln_") while paid plans use Price IDs (starts with "prc_"). You can find both in your Memberstack dashboard under the respective plan settings.

Where do I find my plan/price IDs?

In your Memberstack dashboard: Plans → click on a plan → find the Plan ID for free plans or Price ID for paid plans in the settings

Where do I find my plan IDs?

In your Memberstack dashboard: Plans → click on a plan → copy the ID from the URL or settings

How do members change plans?

Use memberstack.launchStripeCustomerPortal() to let them manage their subscription

Can I offer a trial period?

Yes! Configure trial periods in your Memberstack dashboard when creating plans

## Next Steps

Now that you've set up plan management, you might want to explore:

  * [→ Member Journey Overview](/dom-package/member-journey)
  * [→ Implementing Protected Content](/dom-package/member-journey#protected-content)
  * [→ Using Pre-built Modal Components](/dom-package/pre-built-modals)



## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
