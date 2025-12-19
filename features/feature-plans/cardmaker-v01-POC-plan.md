# Cardmaker v0.1 POC Implementation Plan

## Overview
Build a POC allowing users to generate AI greeting card images and purchase them via Shopify checkout with automated Printify fulfillment.

## Architecture Summary

```
User → CloudFront → S3 (Frontend)
    → API Gateway (IP Policy) → Lambda → Bedrock → S3 (Images)
                                       → Shopify Draft Order
                                       → Printify API (via webhook)
```

**Flow:**
1. User loads frontend from CloudFront (publicly accessible)
2. User generates card → API Gateway checks IP → Lambda calls Bedrock → Image stored in S3
3. User clicks "Buy" → API Gateway checks IP → Lambda creates Shopify Draft Order
4. User pays via Shopify → Webhook triggers Lambda → Lambda submits order to Printify

## Key Decisions
- **Image Storage**: S3 with 48-hour lifecycle expiration
- **Checkout**: Shopify Draft Order API (trusted payment flow)
- **Fulfillment**: Printify API via Shopify webhooks (fully automated)
- **Access Control**: API Gateway IP restriction policy (Phase 1B - optional)
- **Image Generation**: AWS Bedrock Titan Image Generator v2:0 (modular for future swap)
- **Authentication**: None for POC. Memberstack integration remains in codebase but is orthogonal to card generation features.
- **WAF**: Disabled for POC (requires us-east-1 cross-region stack for CloudFront)

## Fulfillment Approach: Printify + Shopify Hybrid

**Why Printify over Gooten:**
- **Fully automated**: No manual image upload needed
- **Direct API**: Submit orders with custom image URLs
- **Webhook support**: Real-time order status updates
- **Well-documented**: Comprehensive REST API
- **Shopify integration**: Keeps familiar checkout flow

**Flow:**
1. User clicks "Buy" → Lambda creates Shopify Draft Order with image URL in line item properties
2. User redirected to Shopify checkout
3. On payment → Shopify webhook triggers Lambda
4. Lambda submits order to Printify API with image URL
5. Printify auto-fulfills (prints & ships card)

**Architecture Decision: Custom Frontend vs Webflow**

For the POC, we're building a custom lightweight frontend (S3 + CloudFront) instead of using Webflow + Smootify because:
- **Full API control**: Direct integration with our Lambda backend
- **Simplicity**: No third-party dependencies for POC testing
- **Speed**: Faster iteration during development
- **Cost**: No Smootify subscription needed for POC

Note: Future versions may integrate with Webflow for production marketing site.

---

## Implementation Phases

### Phase 0: Shopify, Printify & AWS Prerequisites
**Manual steps (UI-based):**

1. **Create Shopify Custom App:**
   - Go to Shopify Admin → Settings → Apps and sales channels → Develop apps
   - Create new app called "Cardmaker POC"
   - Configure Admin API scopes: `write_draft_orders`, `read_orders`, `read_products`
   - Install app and copy Admin API access token

2. **Create Custom Card Product in Shopify:**
   - Go to Products → Add product
   - Name: "Custom AI Greeting Card"
   - Set price (e.g., $12.99)
   - Disable inventory tracking (print-on-demand)
   - Copy the product ID (from URL or use GraphQL ID)

3. **Setup Printify Account:**
   - Create account at [printify.com](https://printify.com)
   - Go to Account → API
   - Generate API key and copy it
   - Note your Shop ID
   - Find greeting card blueprint ID (5x7 card product)

4. **Enable AWS Bedrock Model:**
   - Go to AWS Console → Bedrock → Model access (us-west-2)
   - Request access to "Titan Image Generator G1"

5. **Get Your IP Address:**
   - Run `curl ifconfig.me` to get your public IP for WAF allowlist

6. **Configure Shopify Webhook (after deployment):**
   - Settings → Notifications → Webhooks → Create webhook
   - Event: `Order payment`
   - Format: JSON
   - URL: `{API_GATEWAY_URL}/webhooks/shopify/orders/paid`
   - Copy webhook signing secret

### Phase 1: Infrastructure Setup ✅ COMPLETED
**Status:** Deployed to test environment

**Files modified/created:**
- `/lib/cardmaker-stack.js` - Added S3 image bucket, Bedrock permissions ✅
- `/lib/constructs/image-bucket.js` (new) - S3 bucket with 48hr lifecycle ✅
- `/lib/constructs/waf-ip-allowlist.js` (new) - Created but disabled (requires us-east-1 cross-region) ⚠️
- `/config/test.json`, `/config/prod.json` - Added guardrails, Bedrock config ✅
- `/.env.example` - Already had required env vars ✅

**Deployed Resources:**
- S3 bucket: `cardmaker-images-test` (48-hour auto-delete)
- Lambda with Bedrock Titan Image Generator v2:0 permissions
- API Gateway: `https://imjd82jn21.execute-api.us-west-2.amazonaws.com/api/`
- CloudFront: `https://d1km502pp6onh8.cloudfront.net`

**Deferred:**
- WAF IP allowlist on CloudFront (requires us-east-1 cross-region stack)
- DynamoDB usage limits table (will be added in Phase 5)

---

### Phase 1B: API Gateway IP Restriction (Alternative to WAF)
**Purpose:** Restrict API access to whitelisted IPs without cross-region complexity

**Files to modify:**
- `/lib/cardmaker-stack.js` - Add resource policy to API Gateway

**Implementation:**

Add IP-based resource policy to API Gateway:

```javascript
// In cardmaker-stack.js, after creating the API Gateway RestApi

// Add resource policy for IP restriction
const ipRestrictionPolicy = new iam.PolicyDocument({
  statements: [
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.AnyPrincipal()],
      actions: ['execute-api:Invoke'],
      resources: ['execute-api:/*'],
      conditions: {
        IpAddress: {
          'aws:SourceIp': config.guardrails.allowedIps || []
        }
      }
    }),
    new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['execute-api:Invoke'],
      resources: ['execute-api:/*'],
      conditions: {
        NotIpAddress: {
          'aws:SourceIp': config.guardrails.allowedIps || []
        }
      }
    })
  ]
});

api.addToResourcePolicy(ipRestrictionPolicy);
```

**What this does:**
- Blocks API requests from IPs not in the allowlist
- Returns 403 Forbidden for unauthorized IPs
- Frontend (CloudFront) remains publicly accessible
- API calls are blocked at AWS level (before hitting Lambda)

**Security Model:**
- **Frontend:** Anyone can load the webpage (HTML/JS/CSS)
- **API Calls:** Only whitelisted IPs can successfully invoke endpoints
- **Protection:** API throttling (10/sec) + daily limits (Phase 5) + IP restriction

**Limitations:**
- Doesn't block CloudFront access (only API calls)
- If someone on whitelisted IP becomes malicious, they could script API calls
- For production, recommend adding proper authentication (Memberstack/Cognito)

**When to enable:** Before wider POC distribution or if IP-based access control is required

**Deployment:**
```bash
npm run deploy:test
```

**Testing:**
1. From whitelisted IP: API calls succeed
2. From different IP (use VPN/mobile): API calls return 403
3. CloudFront frontend loads for everyone (expected)

**New Environment Variables:**
```bash
# Security & Guardrails
CM_ALLOWED_IPS=YOUR.IP.ADDRESS.HERE/32
CM_MAX_DAILY_GENERATIONS=50
CM_MAX_DAILY_ORDERS=10

# Shopify Integration
CM_SHOPIFY_STORE_DOMAIN=YOUR_STORE.myshopify.com
CM_SHOPIFY_ACCESS_TOKEN=shpat_YOUR_TOKEN_HERE
CM_SHOPIFY_CARD_PRODUCT_ID=gid://shopify/Product/YOUR_PRODUCT_ID
CM_SHOPIFY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE

# Printify Integration
CM_PRINTIFY_API_KEY=YOUR_PRINTIFY_API_KEY_HERE
CM_PRINTIFY_SHOP_ID=YOUR_SHOP_ID_HERE
CM_PRINTIFY_CARD_BLUEPRINT_ID=YOUR_GREETING_CARD_BLUEPRINT_ID
```

### Phase 2: Image Generation Service
**Files to create:**
- `/src/lambda/services/image-provider-interface.js` - Abstract interface
- `/src/lambda/services/bedrock-image-service.js` - Bedrock Titan implementation
- `/src/lambda/services/s3-image-service.js` - Upload and presigned URL generation
- `/src/lambda/handlers/generate-card.js` - Endpoint handler

**API: POST /generate-card**
```json
Request:  { "prompt": "sunset mountains Happy Birthday" }
Response: { "imageId": "uuid", "imageUrl": "presigned-url", "expiresAt": "ISO8601" }
```

**Bedrock Config (5x7 at 300 DPI):**
- Model: `amazon.titan-image-generator-v1`
- Dimensions: 1500x2100 pixels
- Quality: premium

### Phase 3: Frontend Card Generator
**Files to modify/create:**
- `/public/index.html` - Add card generator section (prompt input, preview, buy button)
- `/public/card-generator.js` (new) - Generation UI logic
- `/public/styles.css` - Card generator styling
- `/public/config.js` - Add `/generate-card`, `/checkout` endpoints

**UI Components:**
1. Prompt textarea
2. "Generate Card" button with loading state
3. 5x7 image preview
4. "Buy This Card" button
5. Shipping address form (name, address, city, state, zip, country)

### Phase 4: Checkout & Fulfillment Integration

#### Part A: Shopify Checkout
**Files to create:**
- `/src/lambda/services/shopify-service.js` - Draft Order creation
- `/src/lambda/handlers/checkout.js` - Checkout endpoint

**API: POST /checkout**
```json
Request:  {
  "imageId": "uuid",
  "shippingAddress": {...},
  "email": "..."
}
Response: {
  "orderId": "shopify-draft-123",
  "checkoutUrl": "https://getbrocards.myshopify.com/..."
}
```

**Implementation:**
- Create Shopify Draft Order via Admin API
- Store image URL in line item properties:
  ```json
  {
    "properties": [
      {"name": "Card Image URL", "value": "https://s3.../card.png"},
      {"name": "Card Image ID", "value": "uuid"}
    ]
  }
  ```

#### Part B: Webhook Handler (Automated Fulfillment)
**Files to create:**
- `/src/lambda/handlers/shopify-webhook.js` - Webhook receiver & validator
- `/src/lambda/utils/shopify-hmac.js` - HMAC signature verification

**API: POST /webhooks/shopify/orders/paid**
```json
Shopify sends:
{
  "id": 5678901234,
  "email": "customer@example.com",
  "line_items": [{
    "properties": [
      {"name": "Card Image URL", "value": "https://s3.../card.png"}
    ]
  }],
  "shipping_address": {...}
}
```

**Implementation:**
1. Verify HMAC signature (security)
2. Extract image URL from line item properties
3. Call Printify service to submit order

#### Part C: Printify Integration
**Files to create:**
- `/src/lambda/services/printify-service.js` - Printify API order submission
- `/src/lambda/utils/printify-client.js` - HTTP client for Printify API

**Printify API Call:**
```javascript
POST https://api.printify.com/v1/shops/{shop_id}/orders.json
Headers: { Authorization: `Bearer ${CM_PRINTIFY_API_KEY}` }
Body: {
  "external_id": "shopify-5678901234",
  "line_items": [{
    "product_id": "${CM_PRINTIFY_CARD_BLUEPRINT_ID}",
    "variant_id": "{5x7_variant_id}",
    "quantity": 1,
    "print_areas": {
      "front": "https://s3.../card.png"  // AI-generated image URL
    }
  }],
  "shipping_method": 1,
  "address_to": {
    "first_name": "...",
    "last_name": "...",
    // ... shipping address from Shopify
  }
}
```

#### Part D: Order Status (Optional for POC)
**Files to create (if needed):**
- `/src/lambda/handlers/printify-webhook.js` - Printify status updates
- `/src/lambda/handlers/order-status.js` - Status lookup endpoint

### Phase 5: Guardrails & Testing
**Files to create:**
- `/src/lambda/utils/spending-guard.js` - Daily limit enforcement (DynamoDB counter)
- `/tests/lambda-generate-card.js` - Unit tests
- `/tests/lambda-checkout.js` - Unit tests
- `/tests/frontend-card-generator.spec.js` - Playwright E2E

**Guardrails:**
| Guard | Limit | Implementation |
|-------|-------|----------------|
| Daily generations | 50 | DynamoDB counter |
| Daily orders | 10 | DynamoDB counter |
| IP restriction | allowlist | WAF WebACL |
| Rate limiting | 5/min | API Gateway method throttling |

---

## Critical Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `/lib/cardmaker-stack.js` | Modify | Add S3 bucket, WAF, Bedrock perms, webhook routes |
| `/src/lambda/handler.js` | Modify | Add route dispatch for endpoints + webhooks |
| `/src/lambda/services/bedrock-image-service.js` | Create | Modular image generation |
| `/src/lambda/services/shopify-service.js` | Create | Shopify Draft Order API |
| `/src/lambda/services/printify-service.js` | **Create** | Printify order submission API |
| `/src/lambda/utils/printify-client.js` | **Create** | Printify HTTP client |
| `/src/lambda/handlers/generate-card.js` | Create | Image generation endpoint |
| `/src/lambda/handlers/checkout.js` | Create | Checkout endpoint |
| `/src/lambda/handlers/shopify-webhook.js` | **Create** | Shopify webhook receiver |
| `/src/lambda/utils/shopify-hmac.js` | **Create** | Webhook HMAC verification |
| `/public/index.html` | Modify | Add card generator UI |
| `/public/card-generator.js` | Create | Frontend generation logic |
| `/public/config.js` | Modify | Add new API endpoints |
| `/.env.example` | Modify | Add Shopify/Printify/Bedrock/guardrail vars |
| `/config/test.json` | Modify | Add new config values |

---

## Testing Checklist

### Image Generation
- [ ] Generate card with various prompts
- [ ] Verify 5x7 dimensions (1500x2100px)
- [ ] Confirm S3 presigned URL works
- [ ] Test Bedrock fallback/error handling

### Checkout Flow
- [ ] Test Shopify draft order creation
- [ ] Verify image URL stored in line item properties
- [ ] Complete Shopify checkout (test mode)
- [ ] Confirm redirect to Shopify works

### Webhook & Fulfillment
- [ ] Test Shopify webhook HMAC verification
- [ ] Verify webhook receives orders/paid event
- [ ] Test Printify API order submission
- [ ] Confirm Printify receives correct image URL
- [ ] Check Printify dashboard for order

### Security & Guardrails
- [ ] Verify IP allowlist blocks unauthorized access
- [ ] Verify daily generation limit enforced (50/day)
- [ ] Verify daily order limit enforced (10/day)
- [ ] Test rate limiting on /generate-card (5/min)

### End-to-End
- [ ] Full flow: Generate → Checkout → Pay → Webhook → Printify
- [ ] Verify card ships from Printify

---

## Prerequisites (Handled in Phase 0)
All prerequisites are covered in Phase 0 (manual Shopify/AWS setup steps). Complete Phase 0 before starting Phase 1.
