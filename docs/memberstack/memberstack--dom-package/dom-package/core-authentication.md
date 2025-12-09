[ Memberstack Developers Documentation](/)

[](/)

Dom Package

  * [Quick Start](/dom-package/quick-start)

  * [Core Authentication](/dom-package/core-authentication)

    * [Email/Password Flow](/dom-package/core-authentication#email-password-flow)
    * [Passwordless Flow](/dom-package/core-authentication#passwordless-flow)
    * [Social Provider Flow](/dom-package/core-authentication#social-provider-flow)
    * [Logout & Session Management](/dom-package/core-authentication#logout-session-management)
  * [Member Journey](/dom-package/member-journey)

  * [Plan Management](/dom-package/plan-management)

  * [Pre-built Modals](/dom-package/pre-built-modals)

  * [Advanced Integration](/dom-package/advanced-integration)

  * [Playground](/dom-package/playground)




# Core Authentication

This guide covers all authentication methods available in the Memberstack DOM package. The examples use vanilla JavaScript and can be adapted to any framework.

### Before You Start

Complete the [Quick Start Guide](/dom-package/quick-start) and initialize Memberstack in your project with your public key before proceeding.

## Email/Password Flow

The traditional email and password authentication method provides a familiar login experience. This example includes loading states and error handling for a better user experience.

// Add this HTML to your login page

<form id="loginForm">

<input type="email" id="email" placeholder="Email" />

<input type="password" id="password" placeholder="Password" />

<button type="submit" id="loginButton">Log In</button>

<div id="loginError" style="display: none; color: red;"></div>

</form>

// Add this JavaScript to handle the login

document.getElementById('loginForm').addEventListener('submit', async (event) => {

event.preventDefault();

const loginButton = document.getElementById('loginButton');

const errorDiv = document.getElementById('loginError');

// Disable button and show loading state

loginButton.disabled = true;

loginButton.textContent = 'Logging in...';

errorDiv.style.display = 'none';

// Get form values

const email = document.getElementById('email').value;

const password = document.getElementById('password').value;

try {

const member = await memberstack.loginMemberEmailPassword({

email,

password

});

// If login is successful, redirect to dashboard

window.location.href = "/dashboard";

} catch (error) {

errorDiv.textContent = error.message || "Login failed. Please check your credentials.";

errorDiv.style.display = 'block';

} finally {

// Reset button state

loginButton.disabled = false;

loginButton.textContent = 'Log In';

}

});

### Best Practices

  * Always show loading states during authentication
  * Provide clear error messages for validation failures
  * Implement proper client-side email validation
  * Include password strength indicators



## Passwordless Flow

Passwordless authentication provides a secure and user-friendly alternative to traditional passwords. Users receive a six-digit code via email that automatically logs them in. You can configure the passwordless email template in the Memberstack dashboard at "Settings" > "Emails".

// Add this HTML to your login page

<form id="passwordlessForm">

<input type="email" id="passwordlessEmail" placeholder="Email" />

<button type="submit" id="passwordlessButton">Login with passwordless</button>

<div id="passwordlessMessage"></div>

<div id="passwordlessError" style="display: none; color: red;"></div>

</form>

// Add this JavaScript to handle passwordless login

let isEmailSent = false;

const form = document.getElementById('passwordlessForm');

const button = document.getElementById('passwordlessButton');

const messageDiv = document.getElementById('passwordlessMessage');

const errorDiv = document.getElementById('passwordlessError');

form.addEventListener('submit', async (event) => {

event.preventDefault();

if (isEmailSent) return; // Prevent multiple sends

button.disabled = true;

button.textContent = 'Sending...';

errorDiv.style.display = 'none';

const email = document.getElementById('passwordlessEmail').value;

try {

await memberstack.sendMemberLoginPasswordlessEmail({

email,

redirectUrl: window.location.origin + "/dashboard"

});

isEmailSent = true;

messageDiv.textContent = 'Check your email for the login token';

button.textContent = 'Check your email';

// Reset after 60 seconds

setTimeout(() => {

isEmailSent = false;

button.disabled = false;

button.textContent = 'Login with passwordless';

messageDiv.textContent = '';

}, 60000);

} catch (error) {

errorDiv.textContent = error.message || "Couldn't send login email. Please try again.";

errorDiv.style.display = 'block';

button.disabled = false;

button.textContent = 'Login with passwordless';

}

});

// Handle verification (if needed)

async function handlePasswordlessVerification(token) {

try {

const member = await memberstack.loginMemberPasswordless({

passwordlessToken: token

});

window.location.href = "/dashboard";

} catch (error) {

console.error("Verification failed:", error);

}

}

### Implementation Tips

  * Implement rate limiting for passwordless email requests
  * Show clear instructions after the link is sent
  * Handle link expiration gracefully
  * Provide a way to request a new link if needed
  * Consider adding a backup login method



## Social Provider Flow

Social authentication allows users to log in using their existing accounts from supported providers. This can significantly reduce friction in the signup and login process.

### Provider Setup Required

Before implementing social login, configure your providers in the Memberstack dashboard:

  1. Navigate to your Memberstack dashboard
  2. Go to "Settings" > "Auth Providers"
  3. Enable and configure each provider you want to use
  4. Add authorized domains and callback URLs



// Add this HTML for social login buttons

<div class="social-login-buttons">

<button onclick="loginWithProvider('google')" id="googleLogin">Login with Google</button>

<button onclick="loginWithProvider('github')" id="githubLogin">Login with GitHub</button>

<button onclick="loginWithProvider('facebook')" id="facebookLogin">Login with Facebook</button>

<!-- Add more provider buttons as needed -->

</div>

<div id="socialLoginError" style="display: none; color: red;"></div>

// Add this JavaScript to handle social login

const PROVIDERS = {

GOOGLE: "google",

FACEBOOK: "facebook",

TWITTER: "twitter",

GITHUB: "github",

LINKEDIN: "linkedin"

};

async function loginWithProvider(provider) {

const button = document.getElementById(provider + 'Login');

const errorDiv = document.getElementById('socialLoginError');

button.disabled = true;

errorDiv.style.display = 'none';

try {

await memberstack.loginWithProvider({

provider,

redirectUrl: window.location.origin + "/dashboard",

scope: ["email", "profile"] // Optional: specify required scopes

});

} catch (error) {

errorDiv.textContent = `${provider} login failed: ${error.message}`;

errorDiv.style.display = 'block';

} finally {

button.disabled = false;

}

}

### Supported Providers

  * Google
  * Facebook
  * Twitter
  * GitHub
  * LinkedIn



### Implementation Tips

  * Use official provider logos
  * Handle connection failures gracefully
  * Implement proper scope handling
  * Consider data mapping strategies



## Logout & Session Management

In this section, you'll learn how to handle user sessions, implement a logout function, and manage session expiration.

### Logout Function

Implementing a logout function is essential for user privacy and security. This example shows how to handle logout and clear the session:

// Handle logout

async function handleLogout() {

try {

await memberstack.logout();

window.location.href = "/login";

} catch (error) {

console.error("Logout failed:", error);

}

}

### Session Management

Proper session management is crucial for maintaining security and user experience. This guide will walk you through implementing robust session handling with Memberstack.

### 1\. Basic Setup

First, configure Memberstack with session-specific options during initialization:

const memberstack = memberstackDOM.init({

publicKey: "YOUR_PUBLIC_KEY",

useCookies: true, // Enable cookie persistence

setCookieOnRootDomain: true, // Optional: set cookies on root domain

sessionDurationDays: 30, // How long sessions last

});

#### Configuration Options

Memberstack supports both localStorage (default) and cookie-based storage for session management. Choose based on your specific needs:

  * **useCookies (optional)** : 
    * Set to true to use cookies instead of localStorage
    * Use for cross-tab synchronization needs
    * Consider for multi-subdomain applications
  * **setCookieOnRootDomain (optional)** : Only relevant when useCookies is true
  * **sessionDurationDays (optional)** : Controls session length before re-auth is needed



### 2\. Authentication State Management

Implement a listener to track authentication state changes and update your UI accordingly:

// Add this HTML for auth state display

<div id="authStateContainer">

<div id="loadingState">Loading...</div>

<div id="authenticatedState" style="display: none;">

<p>Welcome, <span id="memberEmail"></span></p>

<p>Session expires: <span id="sessionExpiry"></span></p>

<button onclick="handleLogout()">Log Out</button>

</div>

<div id="unauthenticatedState" style="display: none;">

Please log in

</div>

</div>

// JavaScript for auth state management

document.addEventListener('DOMContentLoaded', () => {

const loadingState = document.getElementById('loadingState');

const authenticatedState = document.getElementById('authenticatedState');

const unauthenticatedState = document.getElementById('unauthenticatedState');

const memberEmailSpan = document.getElementById('memberEmail');

const sessionExpirySpan = document.getElementById('sessionExpiry');

// Listen for authentication changes

const unsubscribe = memberstack.onAuthChange((member) => {

loadingState.style.display = 'none';

if (member) {

authenticatedState.style.display = 'block';

unauthenticatedState.style.display = 'none';

memberEmailSpan.textContent = member.email;

// Display session information

const token = memberstack.getMemberCookie();

if (token) {

const tokenData = parseJwt(token);

const expiryDate = new Date(tokenData.exp * 1000);

sessionExpirySpan.textContent = expiryDate.toLocaleString();

}

} else {

authenticatedState.style.display = 'none';

unauthenticatedState.style.display = 'block';

}

});

});

### 3\. Session Token Handling

Add these helper functions to work with session tokens:

// Parse JWT token to get expiration

function parseJwt(token) {

try {

const base64Url = token.split('.')[1];

const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>

'%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)

).join(''));

return JSON.parse(jsonPayload);

} catch (error) {

console.error('Error parsing token:', error);

return {};

}

}

### 4\. Session Refresh

Implement session refresh functionality to extend user sessions when needed:

// Add a refresh button to your UI

<button onclick="refreshSession()">Extend Session</button>

// Session refresh function

async function refreshSession() {

try {

await memberstack.getCurrentMember();

const token = memberstack.getMemberCookie();

if (token) {

const tokenData = parseJwt(token);

const expiryDate = new Date(tokenData.exp * 1000);

document.getElementById('sessionExpiry').textContent = expiryDate.toLocaleString();

}

} catch (error) {

console.error("Session refresh failed:", error);

}

}

### 5\. Session Expiration Handling

Add proactive session expiration checking to improve user experience:

// Check session expiration status

function checkSessionExpiration() {

const token = memberstack.getMemberCookie();

if (token) {

const tokenData = parseJwt(token);

const expiryTime = tokenData.exp * 1000;

const timeUntilExpiry = expiryTime - Date.now();

if (timeUntilExpiry < 300000) { // Less than 5 minutes

alert("Your session will expire soon. Please refresh your session.");

}

}

}

// Check session status periodically

setInterval(checkSessionExpiration, 60000); // Check every minute

#### Common Issues & Solutions

  * Need cross-tab session sync? Consider enabling useCookies
  * Sessions expiring too quickly? Adjust sessionDurationDays
  * Working with subdomains? Review your domain configuration



#### Best Practices

  * Always use onAuthChange for state management
  * Implement proactive session refresh
  * Handle expired sessions gracefully



## Next Steps

Now that you've implemented authentication, consider exploring:

  * [→ Member Profile Management](/dom-package/member-journey)
  * [→ Protected Content Implementation](/dom-package/member-journey#protected-content)
  * [→ Subscription Plan Setup](/dom-package/plan-management)



## Need Help?

Having trouble getting your login working? We're here to help!

[Join our Slack Community →](https://www.memberstack.com/slack) [Find a Memberstack Expert →](https://www.memberstack.com/experts) [Search the Help Center →](https://docs.memberstack.com/hc/en-us)

Thank you for choosing Memberstack 🙏
