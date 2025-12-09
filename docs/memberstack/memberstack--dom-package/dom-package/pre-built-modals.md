[ Memberstack Developers Documentation](/)

[](/)

Dom Package

  * [Quick Start](/dom-package/quick-start)

  * [Core Authentication](/dom-package/core-authentication)

  * [Member Journey](/dom-package/member-journey)

  * [Plan Management](/dom-package/plan-management)

  * [Pre-built Modals](/dom-package/pre-built-modals)

    * [Login Modal](/dom-package/pre-built-modals#login-modal)
    * [Signup Modal](/dom-package/pre-built-modals#signup-modal)
    * [Profile Modal](/dom-package/pre-built-modals#profile-modal)
  * [Advanced Integration](/dom-package/advanced-integration)

  * [Playground](/dom-package/playground)




# Pre-built Modals

Memberstack provides professional, ready-to-use modals for login, signup, and profile management. These modals handle all the UI and authentication logic for you - just open them with a single line of code!

### Before You Start

  * Make sure you've initialized Memberstack with your public key
  * Create your plans in the Memberstack dashboard
  * Check your site is running on HTTPS for live mode



## Login Modal

The login modal provides a complete login interface with email/password, social login (if enabled), and a forgot password option.

// Basic usage

await memberstack.openModal("LOGIN");

// With configuration options

await memberstack.openModal("LOGIN", {

signup: {

plans: ["pln_xyz", "pln_abc"] // Your free plan IDs

}

});

// With return data handling

memberstack.openModal("LOGIN").then(({ data, type }) => {

console.log("Login event type:", type);

console.log("Returned data:", data);

// Close the modal

memberstack.hideModal();

});

### What's Included

  * Email and password login form
  * Social login buttons (if enabled in dashboard)
  * Forgot password link
  * Optional signup link (for free plans)
  * Error handling and validation



## Signup Modal

The signup modal handles new member registration. You can connect it to specific free plans or let members sign up without a plan.

// Basic usage

await memberstack.openModal("SIGNUP");

// With free plans

await memberstack.openModal("SIGNUP", {

signup: {

plans: ["pln_xyz", "pln_abc"] // Your free plan IDs

}

});

// With data handling

memberstack.openModal("SIGNUP", {

signup: {

plans: ["pln_xyz"]

}

}).then(({ data, type }) => {

console.log("Signup event type:", type);

console.log("Returned data:", data);

// Close the modal and redirect

memberstack.hideModal();

window.location.href = "/welcome";

});

### Important Notes

  * Only use free plan IDs in the signup options
  * For paid plans, use purchasePlansWithCheckout instead
  * Get your plan IDs from the Memberstack dashboard
  * Remember to close the modal after successful signup



## Profile Modal

The profile modal lets members manage their account settings, subscription, and team membership all in one place.

// Basic usage

await memberstack.openModal("PROFILE");

// Open specific tab

await memberstack.openModal("PROFILE", {

defaultTab: "account" // or "billing", "team", etc.

});

// Example function for profile button

function openProfileModal() {

memberstack.openModal("PROFILE").then(() => {

// Modal has been closed

console.log("Profile modal closed");

});

}

### Available Tabs

  * "account" - Profile information
  * "billing" - Subscription management
  * "team" - Team settings (if enabled)
  * "security" - Password and 2FA



### When to Show It

  * After login/signup success
  * From account/profile menu
  * When updating billing
  * Managing team settings



## Password Reset Modals

Memberstack provides two modals for password management:

// Open forgot password modal

await memberstack.openModal("FORGOT_PASSWORD");

// Open reset password modal (for password reset tokens)

await memberstack.openModal("RESET_PASSWORD");

  * **FORGOT_PASSWORD** \- Sends a reset link to member's email
  * **RESET_PASSWORD** \- Where members set their new password



## Common Questions

Do modals close automatically?

No, you need to call memberstack.hideModal() to close them.

Can I style the modals?

Basic styling can be configured in your Memberstack dashboard.

What data do modals return?

Login and signup modals return a promise with type and data properties.

Do I need HTTPS?

Yes for live mode, but HTTP works in sandbox mode for testing.

## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
