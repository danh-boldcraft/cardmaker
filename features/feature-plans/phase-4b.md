# Phase 4b: Shopify Webhook Handler - Implementation Plan

## Overview
Implement the Shopify webhook handler that receives `orders/paid` events, verifies HMAC signatures, and triggers Printify order submission.

## Current State
- **Phase 4a complete**: Shopify checkout creates Draft Orders, redirects to Shopify payment
- **Branch**: `phase4b`
- **Existing patterns**: Service layer (`src/lambda/services/`), handler layer (`src/lambda/handlers/`)

## Prerequisites
Before implementing, ensure these are configured:

1. **Shopify Webhook configured** (after Phase 4a deployment):
   - Settings → Notifications → Webhooks → Create webhook
   - Event: `Order payment`
   - Format: JSON
   - URL: `{API_GATEWAY_URL}/webhooks/shopify/orders/paid`
   - Copy webhook signing secret to `CM_SHOPIFY_WEBHOOK_SECRET`

2. **Environment variables** in `.env`:
   - `CM_SHOPIFY_WEBHOOK_SECRET` - Webhook signing secret from Shopify

---

## Implementation Tasks

### 1. Create HMAC Verification Utility (`src/lambda/utils/shopify-hmac.js`)

Verifies Shopify webhook signatures to prevent spoofed requests.

**Key functions:**
- `verifyShopifyHmac(body, hmacHeader, secret)` - Returns boolean

**Implementation:**
```javascript
const crypto = require('crypto');

function verifyShopifyHmac(body, hmacHeader, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hmacHeader)
  );
}
```

**Security notes:**
- Use `timingSafeEqual` to prevent timing attacks
- Body must be raw string, not parsed JSON
- HMAC header is in `X-Shopify-Hmac-Sha256`

### 2. Create Webhook Handler (`src/lambda/handlers/shopify-webhook.js`)

Endpoint handler for `/webhooks/shopify/orders/paid`.

**Request validation:**
- Verify HMAC signature (return 401 if invalid)
- Validate required fields in payload
- Extract image URL from line item properties

**Flow:**
1. Get raw body and HMAC header
2. Verify HMAC signature
3. Parse order payload
4. Find line items with card image properties
5. Call Printify service (Phase 4c) to submit order
6. Return 200 OK

**Shopify webhook payload structure:**
```json
{
  "id": 5678901234,
  "order_number": 1234,
  "email": "customer@example.com",
  "line_items": [{
    "id": 123456,
    "title": "Custom AI Greeting Card",
    "quantity": 1,
    "properties": [
      {"name": "_Card Image URL", "value": "https://s3.../card.png"},
      {"name": "_Card Image ID", "value": "uuid-here"}
    ]
  }],
  "shipping_address": {
    "first_name": "John",
    "last_name": "Doe",
    "address1": "123 Main St",
    "address2": "",
    "city": "San Francisco",
    "province": "California",
    "province_code": "CA",
    "country": "United States",
    "country_code": "US",
    "zip": "94102"
  }
}
```

**Response format:**
- `200 OK` - Webhook processed successfully
- `401 Unauthorized` - Invalid HMAC signature
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - Processing error

**Note:** Shopify expects a 200 response within 5 seconds. For Phase 4b, we'll log the order and prepare for Printify. Phase 4c will add actual Printify submission.

### 3. Update Main Handler (`src/lambda/handler.js`)

Add route for webhook:

```javascript
const { handleShopifyWebhook } = require('./handlers/shopify-webhook');

// In exports.handler, add before other routes:
if (path === '/webhooks/shopify/orders/paid' && method === 'POST') {
  return handleShopifyWebhook(event);
}
```

**Important:** Webhook handler needs raw body for HMAC verification. The event.body should be the raw string, not parsed.

### 4. Update CDK Stack (`lib/cardmaker-stack.js`)

Add API Gateway resource for webhook:

```javascript
// After checkout resource
const webhooksResource = api.root.addResource('webhooks');
const shopifyResource = webhooksResource.addResource('shopify');
const ordersResource = shopifyResource.addResource('orders');
const paidResource = ordersResource.addResource('paid');

paidResource.addMethod('POST', lambdaIntegration, {
  methodResponses: [{ statusCode: '200' }]
});
```

Add webhook secret environment variable to Lambda:

```javascript
environment: {
  // ... existing vars
  SHOPIFY_WEBHOOK_SECRET: process.env.CM_SHOPIFY_WEBHOOK_SECRET,
}
```

### 5. Update .env.example

Add webhook secret variable:

```bash
# Shopify Webhook (configure after deployment)
CM_SHOPIFY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE
```

---

## API Specification

### POST /webhooks/shopify/orders/paid

**Headers:**
- `X-Shopify-Hmac-Sha256`: Base64-encoded HMAC signature
- `X-Shopify-Shop-Domain`: Store domain
- `X-Shopify-Topic`: `orders/paid`

**Response (200):**
```json
{
  "received": true,
  "orderId": 5678901234
}
```

**Response (401 - Invalid signature):**
```json
{
  "error": "Invalid webhook signature"
}
```

---

## Critical Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/lambda/utils/shopify-hmac.js` | Create | HMAC signature verification |
| `src/lambda/handlers/shopify-webhook.js` | Create | Webhook endpoint handler |
| `src/lambda/handler.js` | Modify | Add webhook route |
| `lib/cardmaker-stack.js` | Modify | Add webhook API Gateway resource |
| `.env.example` | Modify | Add webhook secret variable |

---

## Implementation Order

1. Create `shopify-hmac.js` utility
2. Create `shopify-webhook.js` handler
3. Update `handler.js` with route
4. Update `cardmaker-stack.js` with API Gateway resource
5. Update `.env.example`
6. Deploy and test

---

## Testing

### Manual Testing

1. **Deploy to test environment:**
   ```bash
   npm run deploy:test
   ```

2. **Configure Shopify webhook:**
   - Go to Shopify Admin → Settings → Notifications → Webhooks
   - Create webhook for "Order payment" event
   - URL: `https://imjd82jn21.execute-api.us-west-2.amazonaws.com/api/webhooks/shopify/orders/paid`
   - Copy the signing secret to `.env`

3. **Test with a real order:**
   - Complete a test checkout flow
   - Check CloudWatch logs for webhook receipt
   - Verify HMAC validation passes

### Test Cases

- Valid HMAC signature → 200 OK
- Invalid HMAC signature → 401 Unauthorized
- Missing line item properties → Log warning, continue
- Shopify retry (duplicate webhook) → Handle idempotently

---

## Security Considerations

- **HMAC verification**: Prevents spoofed webhook requests
- **Timing-safe comparison**: Prevents timing attacks on signature
- **Raw body handling**: Ensures correct HMAC calculation
- **Idempotency**: Webhooks may be retried; handle duplicates gracefully

---

## Follow-up (Phase 4c)

After Phase 4b is complete, Phase 4c will implement:
- Printify service (`printify-service.js`)
- Actual order submission to Printify API
- Image URL passing to Printify for printing
