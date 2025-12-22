# Phase 4a: Shopify Checkout Integration - Implementation Plan

## Overview
Implement the `/checkout` endpoint that creates a Shopify Draft Order with the AI-generated card image, allowing users to complete their purchase through Shopify's checkout flow.

## Current State
- **Phase 2 complete**: Image generation working (`/generate-card` endpoint, Bedrock, S3)
- **Phase 3 complete**: Frontend card generator with preview
- **Branch**: `phase4a`
- **Existing patterns**: Service layer (`src/lambda/services/`), handler layer (`src/lambda/handlers/`)

## Prerequisites
Before implementing, ensure these are set up in Shopify Admin:

1. **Shopify Custom App** with scopes: `write_draft_orders`, `read_orders`, `read_products`
2. **Product created**: "Custom AI Greeting Card" with price set
3. **Environment variables configured** in `.env`:
   - `CM_SHOPIFY_STORE_DOMAIN`
   - `CM_SHOPIFY_ACCESS_TOKEN`
   - `CM_SHOPIFY_CARD_PRODUCT_ID`

---

## Implementation Tasks

### 1. Create Shopify Service (`src/lambda/services/shopify-service.js`)

Creates Draft Orders via Shopify Admin API.

**Key functions:**
- `createDraftOrder({ imageId, imageUrl, email, shippingAddress })` - Main entry point
- Uses Shopify Admin REST API: `POST /admin/api/2024-01/draft_orders.json`
- Stores image metadata in line item properties for later fulfillment

**Draft Order payload structure:**
```javascript
{
  draft_order: {
    email: customerEmail,
    line_items: [{
      variant_id: process.env.CM_SHOPIFY_CARD_VARIANT_ID, // or use product_id
      quantity: 1,
      properties: [
        { name: "Card Image URL", value: imageUrl },
        { name: "Card Image ID", value: imageId }
      ]
    }],
    shipping_address: {
      first_name: "...",
      last_name: "...",
      address1: "...",
      city: "...",
      province: "...",      // state/province code
      country: "...",       // country code (US, CA, etc.)
      zip: "..."
    },
    use_customer_default_address: false
  }
}
```

**Response handling:**
- Extract `invoice_url` for checkout redirect
- Extract `id` as orderId reference
- Handle API errors gracefully

**Environment variables used:**
- `CM_SHOPIFY_STORE_DOMAIN` - Store domain (e.g., `getbrocards.myshopify.com`)
- `CM_SHOPIFY_ACCESS_TOKEN` - Admin API access token
- `CM_SHOPIFY_CARD_PRODUCT_ID` - Product ID for the greeting card

### 2. Create Checkout Handler (`src/lambda/handlers/checkout.js`)

Endpoint handler for `/checkout`.

**Request validation:**
- Required fields: `imageId`, `email`, `shippingAddress`
- Shipping address required fields: `firstName`, `lastName`, `address1`, `city`, `state`, `country`, `zip`
- Validate email format
- Validate imageId exists (optional: check S3)

**Daily order limit check:**
- Use existing `usage-tracker-service.js` pattern
- Add `checkOrderLimit()` and `incrementOrderCount()` functions
- Limit from config: `MAX_DAILY_ORDERS` (10/day)

**Flow:**
1. Validate request body
2. Check daily order limit (return 429 if exceeded)
3. Call Shopify service to create Draft Order
4. Increment order counter on success
5. Return checkout URL

**Response format:**
```json
{
  "orderId": "gid://shopify/DraftOrder/123456789",
  "checkoutUrl": "https://getbrocards.myshopify.com/..."
}
```

### 3. Update Usage Tracker Service

Add order tracking alongside existing generation tracking.

**New functions:**
- `checkOrderLimit()` - Returns `{ allowed, currentCount, limit }`
- `incrementOrderCount()` - Atomic increment of daily order count

**DynamoDB schema addition:**
- Same table: `cardmaker-usage-{env}`
- New attribute: `orderCount` (alongside existing `generationCount`)

### 4. Update Main Handler (`src/lambda/handler.js`)

Add route for `/checkout`:

```javascript
const { handleCheckout } = require('./handlers/checkout');

// In exports.handler
if (path === '/checkout') {
  return handleCheckout(event);
}
```

### 5. Update CDK Stack (`lib/cardmaker-stack.js`)

Add API Gateway resource for `/checkout`:

```javascript
// After generate-card resource
const checkoutResource = api.root.addResource('checkout');

checkoutResource.addMethod('POST', lambdaIntegration, {
  methodResponses: [{ statusCode: '200' }]
});
```

Add Shopify environment variables to Lambda:

```javascript
environment: {
  // ... existing vars
  SHOPIFY_STORE_DOMAIN: process.env.CM_SHOPIFY_STORE_DOMAIN,
  SHOPIFY_ACCESS_TOKEN: process.env.CM_SHOPIFY_ACCESS_TOKEN,
  SHOPIFY_CARD_PRODUCT_ID: process.env.CM_SHOPIFY_CARD_PRODUCT_ID,
}
```

### 6. Update Frontend

#### 6a. Update `public/config.js`

Add checkout endpoint:

```javascript
API_ENDPOINTS: {
  multiply: '/multiply',
  memberInfo: '/member-info',
  generateCard: '/generate-card',
  checkout: '/checkout'  // NEW
}
```

Add `checkoutEndpoint` getter similar to `generateCardEndpoint`.

#### 6b. Update `public/index.html`

Add checkout section after card preview:

```html
<!-- Checkout Section (shown after card is generated) -->
<div id="checkoutSection" class="checkout-section hidden">
  <h3>Buy This Card</h3>
  <p class="price">$12.99 + shipping</p>

  <form id="checkoutForm">
    <div class="form-row">
      <div class="form-group">
        <label for="firstName">First Name *</label>
        <input type="text" id="firstName" required>
      </div>
      <div class="form-group">
        <label for="lastName">Last Name *</label>
        <input type="text" id="lastName" required>
      </div>
    </div>

    <div class="form-group">
      <label for="email">Email *</label>
      <input type="email" id="email" required>
    </div>

    <div class="form-group">
      <label for="address1">Address *</label>
      <input type="text" id="address1" required>
    </div>

    <div class="form-group">
      <label for="address2">Address Line 2</label>
      <input type="text" id="address2">
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="city">City *</label>
        <input type="text" id="city" required>
      </div>
      <div class="form-group">
        <label for="state">State *</label>
        <input type="text" id="state" required placeholder="e.g., CA">
      </div>
      <div class="form-group">
        <label for="zip">ZIP Code *</label>
        <input type="text" id="zip" required>
      </div>
    </div>

    <div class="form-group">
      <label for="country">Country *</label>
      <select id="country" required>
        <option value="US">United States</option>
        <option value="CA">Canada</option>
        <!-- Add more as needed -->
      </select>
    </div>

    <button type="submit" id="checkoutBtn" class="checkout-btn">
      <span id="checkoutBtnText">Proceed to Payment</span>
      <span id="checkoutBtnLoader" class="loader hidden"></span>
    </button>
  </form>

  <div id="checkoutError" class="error hidden">
    <div class="error-icon">⚠️</div>
    <div id="checkoutErrorMessage"></div>
  </div>
</div>
```

#### 6c. Create `public/checkout.js`

Checkout UI logic:

**Functions:**
- `initCheckout()` - Initialize form event listeners
- `showCheckoutSection()` - Display checkout form after card generation
- `handleCheckoutSubmit(e)` - Process form submission
- `redirectToShopify(checkoutUrl)` - Redirect user to Shopify checkout
- `showCheckoutError(message)` - Display error messages

**Integration with card-generator.js:**
- After successful card generation, call `showCheckoutSection()`
- Pass `window.currentCard` data to checkout submission

#### 6d. Update `public/styles.css`

Add checkout form styling:
- Form layout (responsive grid)
- Input styling consistent with existing design
- Checkout button styling
- Error states

### 7. Testing

Create `tests/lambda-checkout.js`:

**Test cases:**
- Valid checkout request creates Draft Order
- Missing required fields return 400
- Invalid email format returns 400
- Daily order limit returns 429
- Shopify API errors handled gracefully

---

## API Specification

### POST /checkout

**Request:**
```json
{
  "imageId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "customer@example.com",
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "address2": "Apt 4B",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102",
    "country": "US"
  }
}
```

**Response (200):**
```json
{
  "orderId": "gid://shopify/DraftOrder/123456789",
  "checkoutUrl": "https://getbrocards.myshopify.com/..."
}
```

**Error (400 - Validation):**
```json
{
  "error": "Missing required field: email"
}
```

**Error (429 - Rate Limited):**
```json
{
  "error": "Daily order limit reached (10/day). Try again tomorrow.",
  "currentCount": 10,
  "limit": 10
}
```

**Error (500 - Shopify API):**
```json
{
  "error": "Failed to create order: [Shopify error message]"
}
```

---

## Critical Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/lambda/services/shopify-service.js` | Create | Shopify Draft Order API wrapper |
| `src/lambda/handlers/checkout.js` | Create | /checkout endpoint handler |
| `src/lambda/services/usage-tracker-service.js` | Modify | Add order limit tracking |
| `src/lambda/handler.js` | Modify | Add /checkout route |
| `lib/cardmaker-stack.js` | Modify | Add /checkout API Gateway resource |
| `public/config.js` | Modify | Add checkout endpoint config |
| `public/index.html` | Modify | Add checkout form UI |
| `public/checkout.js` | Create | Checkout frontend logic |
| `public/card-generator.js` | Modify | Show checkout after generation |
| `public/styles.css` | Modify | Checkout form styling |
| `tests/lambda-checkout.js` | Create | Unit tests |

---

## Implementation Order

1. **Backend first:**
   1. Create `shopify-service.js`
   2. Update `usage-tracker-service.js` with order tracking
   3. Create `checkout.js` handler
   4. Update `handler.js` with route
   5. Update `cardmaker-stack.js` with API Gateway resource

2. **Deploy and test backend:**
   ```bash
   npm run deploy:test
   curl -X POST https://imjd82jn21.execute-api.us-west-2.amazonaws.com/api/checkout \
     -H "Content-Type: application/json" \
     -d '{"imageId":"test","email":"test@example.com","shippingAddress":{...}}'
   ```

3. **Frontend:**
   1. Update `config.js` with endpoint
   2. Add checkout section to `index.html`
   3. Create `checkout.js`
   4. Update `card-generator.js` to show checkout
   5. Add styles to `styles.css`

4. **Integration test:**
   - Full flow: Generate card -> Fill form -> Submit -> Redirect to Shopify

---

## Environment Variables Checklist

Before deployment, ensure these are set in `.env`:

```bash
# Required for Phase 4a
CM_SHOPIFY_STORE_DOMAIN=getbrocards.myshopify.com
CM_SHOPIFY_ACCESS_TOKEN=shpat_YOUR_ACTUAL_TOKEN
CM_SHOPIFY_CARD_PRODUCT_ID=gid://shopify/Product/YOUR_PRODUCT_ID
CM_MAX_DAILY_ORDERS=10
```

---

## Security Considerations

- **No sensitive data in frontend**: Only imageId is exposed, not direct S3 URLs
- **Shopify handles payment**: We never touch card details
- **Rate limiting**: Both API Gateway throttling and DynamoDB daily limits
- **IP restriction**: Already in place from Phase 1B
- **HTTPS only**: All API calls are over HTTPS

---

## Follow-up (Phase 4b)

After Phase 4a is complete, Phase 4b will implement:
- Shopify webhook handler (`/webhooks/shopify/orders/paid`)
- HMAC signature verification
- Printify order submission
- This is tracked in the main POC plan as "Part B: Webhook Handler"
