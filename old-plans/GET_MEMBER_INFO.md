# This file just describes a POC feature where the frontend calls the backend which calls Memberstack's API and returns some data about the user.

# POC: Get Member Info Feature

## Overview
Add a button for logged-in users to request their Memberstack profile info (name, email, plan) via the backend with JWT token verification.

## User Flow
1. User clicks "Get My Info" button (only visible when logged in)
2. Frontend gets JWT token via `memberstack.getMemberCookie()`
3. Frontend calls `POST /member-info` with `Authorization: Bearer <token>` header
4. Backend verifies token with Memberstack Admin REST API
5. Backend fetches full member data using the verified member ID
6. Backend returns name, email, and plan info
7. Frontend displays the info in a styled card

---

## Files to Modify

### 1. `src/lambda/handler.js`

**Add at the top of file:**
```javascript
const https = require('https');
```

**Add helper function for Memberstack API calls:**
```javascript
function memberstackRequest(path, method, body, secretKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'admin.memberstack.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'X-API-KEY': secretKey,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}
```

**Add new handler function:**
```javascript
async function handleMemberInfo(event) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  // Extract token from Authorization header
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing or invalid Authorization header' })
    };
  }

  const token = authHeader.split(' ')[1];
  const secretKey = process.env.MEMBERSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error('MEMBERSTACK_SECRET_KEY not configured');
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  try {
    // Step 1: Verify token with Memberstack
    const verifyResult = await memberstackRequest('/members/verify-token', 'POST', { token }, secretKey);
    const memberId = verifyResult.data.id;

    // Step 2: Get full member data
    const memberResult = await memberstackRequest(`/members/${memberId}`, 'GET', null, secretKey);
    const member = memberResult.data;

    // Step 3: Extract and return relevant info
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        email: member.auth?.email || '',
        name: member.customFields?.firstName || member.customFields?.name || '',
        plans: (member.planConnections || []).map(p => ({
          planName: p.planName || p.planId,
          status: p.status
        }))
      })
    };
  } catch (error) {
    console.error('Memberstack API error:', error);
    if (error.statusCode === 401) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to fetch member info' })
    };
  }
}
```

**Modify the main handler to add routing:**
```javascript
exports.handler = async (event) => {
  // Route based on path
  const path = event.path || '/multiply';

  if (path === '/member-info') {
    return handleMemberInfo(event);
  }

  // Original multiply logic continues below...
  try {
    // ... existing code
  }
};
```

---

### 2. `local-server.js`

**Update the route check (around line 42-47):**
```javascript
// Change from:
if (req.method !== 'POST' || pathname !== '/multiply') {

// To:
if (req.method !== 'POST' || (pathname !== '/multiply' && pathname !== '/member-info')) {
```

**Update the event object (around line 58-65) to include path and Authorization header:**
```javascript
const event = {
  httpMethod: 'POST',
  path: pathname,  // Use actual pathname instead of hardcoded '/multiply'
  body: body,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': req.headers.authorization || ''  // Pass Authorization header
  },
};
```

---

### 3. `public/index.html`

**Add button inside `loggedInButtons` div (after logout button, around line 28):**
```html
<div id="loggedInButtons" class="auth-buttons hidden">
    <span id="userEmail" class="user-email"></span>
    <button id="getInfoBtn" class="nav-btn">Get My Info</button>
    <button id="logoutBtn" class="nav-btn">Logout</button>
</div>
```

**Add display area after `proBanner` div (around line 38):**
```html
<!-- Member Info Display -->
<div id="memberInfo" class="member-info hidden">
    <div class="member-info-card">
        <h3>Your Member Info</h3>
        <div id="memberInfoContent"></div>
    </div>
</div>
```

---

### 4. `public/app.js`

**Add DOM element references (after line 23):**
```javascript
const getInfoBtn = document.getElementById('getInfoBtn');
const memberInfoDiv = document.getElementById('memberInfo');
const memberInfoContent = document.getElementById('memberInfoContent');
```

**Add click handler inside `initMemberstack()` function, after the logoutBtn handler (after line 205):**
```javascript
// Get My Info button handler
getInfoBtn.addEventListener('click', async () => {
    // Hide previous results
    memberInfoDiv.classList.add('hidden');
    hideError();

    try {
        // Get the JWT token from Memberstack
        const token = memberstack.getMemberCookie();
        if (!token) {
            showError('Not logged in or no session token available');
            return;
        }

        // Build endpoint URL (replace /multiply with /member-info)
        const memberInfoEndpoint = API_CONFIG.endpoint.replace('/multiply', '/member-info');

        // Make authenticated request
        const response = await fetch(memberInfoEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Display the info
        memberInfoContent.innerHTML = `
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Name:</strong> ${data.name || 'Not set'}</p>
            <p><strong>Plans:</strong> ${data.plans.length > 0
                ? data.plans.map(p => `${p.planName} (${p.status})`).join(', ')
                : 'No plans'}</p>
        `;
        memberInfoDiv.classList.remove('hidden');

        if (API_CONFIG.debug) {
            console.log('Member info retrieved:', data);
        }
    } catch (error) {
        console.error('Error fetching member info:', error);
        showError(error.message);
    }
});
```

---

### 5. `public/styles.css`

**Add styles for member info display (at end of file):**
```css
/* Member Info Display */
.member-info {
    max-width: 480px;
    margin: 1rem auto;
}

.member-info-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.member-info-card h3 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
}

.member-info-card p {
    margin: 0.5rem 0;
    font-size: 1rem;
}

.member-info-card strong {
    opacity: 0.9;
}
```

---

### 6. `lib/multiply-stack.js`

**Add API Gateway resource for `/member-info` (after the multiply endpoint, around line 93):**
```javascript
// Create /member-info resource
const memberInfoResource = api.root.addResource('member-info');

// Add POST method to /member-info
memberInfoResource.addMethod('POST', lambdaIntegration, {
    throttling: {
        rateLimit: config.apiGateway.methodThrottling.rateLimit,
        burstLimit: config.apiGateway.methodThrottling.burstLimit
    }
});
```

---

## API Endpoint Specification

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Path** | `/member-info` |
| **Request Header** | `Authorization: Bearer <jwt_token>` |
| **Request Body** | None (empty) |
| **Success Response (200)** | `{ email: string, name: string, plans: [{ planName: string, status: string }] }` |
| **Error 401** | `{ error: "Missing or invalid Authorization header" }` or `{ error: "Invalid or expired token" }` |
| **Error 500** | `{ error: "Server configuration error" }` or `{ error: "Failed to fetch member info" }` |

---

## Memberstack API Endpoints Used

1. **Verify Token**: `POST https://admin.memberstack.com/members/verify-token`
   - Header: `X-API-KEY: <secret_key>`
   - Body: `{ "token": "<jwt>" }`
   - Returns: `{ "data": { "id": "mem_xxx", ... } }`

2. **Get Member**: `GET https://admin.memberstack.com/members/:id`
   - Header: `X-API-KEY: <secret_key>`
   - Returns: `{ "data": { "id": "...", "auth": { "email": "..." }, "customFields": {...}, "planConnections": [...] } }`

---

## Dependencies
None - uses Node.js native `https` module for backend API calls.

---

## Testing Steps
1. Run `npm run local` to start frontend and backend
2. Log in via Memberstack modal
3. Click "Get My Info" button in the navbar
4. Verify email, name (if set in custom fields), and plans are displayed
5. Test error cases: logout and try button (should show auth error)

---

## Environment Variables Required
- `MEMBERSTACK_SECRET_KEY` - Already configured in CDK stack (`lib/multiply-stack.js`)
