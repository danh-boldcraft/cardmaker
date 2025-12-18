# Cardmaker v0.1 POC Implementation Plan

## Overview
Build a POC allowing users to generate AI greeting card images and purchase them via Shopify/Gooten fulfillment.

## Architecture Summary

```
User → WAF (IP Allowlist) → CloudFront → S3 (Frontend)
                                      → API Gateway → Lambda
                                                        ├── /generate-card → Bedrock → S3 (Images)
                                                        ├── /checkout → Shopify Draft Order
                                                        └── /order-status → Shopify Order API
```

## Key Decisions
- **Image Storage**: S3 with 48-hour lifecycle expiration
- **Checkout**: Shopify Draft Order API → Gooten Shopify App (leverages existing infrastructure)
- **Access Control**: AWS WAF IP allowlist on CloudFront
- **Image Generation**: AWS Bedrock Titan Image Generator (modular for future swap)

## Checkout Approach: Shopify + Gooten App

**Why Shopify over Direct Gooten API:**
- Leverages existing Shopify store and payment infrastructure
- Gooten app (already available) auto-fulfills paid orders
- No need to build payment integration
- Customer trust with familiar checkout
- Easy guardrails via Shopify order limits

**Flow:**
1. User clicks "Buy" → Lambda creates Shopify Draft Order with image URL in line item properties
2. User redirected to Shopify checkout
3. On payment, Gooten app auto-fulfills

---

## Implementation Phases

### Phase 0: Shopify & AWS Prerequisites
**Manual steps (UI-based):**

1. **Create Shopify Private App:**
   - Go to Shopify Admin → Settings → Apps and sales channels → Develop apps
   - Create new app called "Cardmaker POC"
   - Configure Admin API scopes: `write_draft_orders`, `read_orders`, `read_products`
   - Install app and copy Admin API access token

2. **Create Custom Card Product in Shopify:**
   - Go to Products → Add product
   - Name: "Custom AI Greeting Card"
   - Set price (e.g., $12.99)
   - Copy the product ID (from URL: `/products/[ID]`)

3. **Verify Gooten App:**
   - Confirm Gooten app is installed in Shopify
   - Map the custom card product to Gooten's 5x7 card SKU

4. **Enable AWS Bedrock Model:**
   - Go to AWS Console → Bedrock → Model access (us-west-2)
   - Request access to "Titan Image Generator G1"

5. **Get Your IP Address:**
   - Run `curl ifconfig.me` to get your public IP for WAF allowlist

### Phase 1: Infrastructure Setup
**Files to modify/create:**
- `/lib/cardmaker-stack.js` - Add S3 image bucket, WAF WebACL, Bedrock permissions
- `/lib/constructs/image-bucket.js` (new) - S3 bucket with 48hr lifecycle
- `/lib/constructs/waf-ip-allowlist.js` (new) - WAF IP set and WebACL
- `/config/test.json`, `/config/prod.json` - Add `allowedIPs`, `maxDailyGenerations`, `maxDailyOrders`
- `/.env.example` - Add new env vars

**New Environment Variables:**
```
CM_ALLOWED_IPS=x.x.x.x/32,y.y.y.y/32
CM_MAX_DAILY_GENERATIONS=50
CM_MAX_DAILY_ORDERS=10
CM_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
CM_SHOPIFY_ACCESS_TOKEN=shpat_xxx
CM_SHOPIFY_CARD_PRODUCT_ID=gid://shopify/Product/xxx
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

### Phase 4: Checkout Integration
**Files to create:**
- `/src/lambda/services/shopify-service.js` - Draft Order creation
- `/src/lambda/handlers/checkout.js` - Checkout endpoint
- `/src/lambda/handlers/order-status.js` - Order status lookup

**Shopify Setup Required:**
1. Create "Custom Greeting Card" product in Shopify admin
2. Create Shopify private app for Admin API access
3. Configure Gooten app to read line item image URL property

**API: POST /checkout**
```json
Request:  { "imageId": "uuid", "shippingAddress": {...}, "email": "..." }
Response: { "orderId": "...", "checkoutUrl": "shopify-checkout-url" }
```

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
| `/lib/cardmaker-stack.js` | Modify | Add S3 bucket, WAF, Bedrock perms, new routes |
| `/src/lambda/handler.js` | Modify | Add route dispatch for new endpoints |
| `/src/lambda/services/bedrock-image-service.js` | Create | Modular image generation |
| `/src/lambda/services/shopify-service.js` | Create | Shopify Draft Order API |
| `/src/lambda/handlers/generate-card.js` | Create | Image generation endpoint |
| `/src/lambda/handlers/checkout.js` | Create | Checkout endpoint |
| `/public/index.html` | Modify | Add card generator UI |
| `/public/card-generator.js` | Create | Frontend generation logic |
| `/public/config.js` | Modify | Add new API endpoints |
| `/.env.example` | Modify | Add Shopify/Bedrock/guardrail vars |
| `/config/test.json` | Modify | Add new config values |

---

## Testing Checklist
- [ ] Generate card with various prompts
- [ ] Verify 5x7 dimensions (1500x2100px)
- [ ] Confirm S3 presigned URL works
- [ ] Test Shopify checkout flow (test mode)
- [ ] Verify IP allowlist blocks unauthorized access
- [ ] Verify daily limits are enforced
- [ ] Test rate limiting on /generate-card

---

## Prerequisites (Handled in Phase 0)
All prerequisites are covered in Phase 0 (manual Shopify/AWS setup steps). Complete Phase 0 before starting Phase 1.
