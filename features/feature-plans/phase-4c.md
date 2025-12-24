# Phase 4c: Printify Integration - Implementation Plan

## Overview
Implement the Printify service that submits orders to Printify's API when a Shopify order is paid. This completes the automated fulfillment flow.

## Current State
- **Phase 4b complete**: Shopify webhook handler receives orders/paid events, verifies HMAC, extracts card image data
- **Branch**: `phase4c`
- **Existing patterns**: Service layer (`src/lambda/services/`), handler layer (`src/lambda/handlers/`)

## Prerequisites
Environment variables already configured in `.env`:
- `CM_PRINTIFY_API_KEY` - API key for Printify
- `CM_PRINTIFY_SHOP_ID` - Your Printify shop ID
- `CM_PRINTIFY_CARD_BLUEPRINT_ID` - Blueprint ID for greeting card product

---

## Implementation Tasks

### 1. Create Printify Service (`src/lambda/services/printify-service.js`)

Submits orders to Printify API for fulfillment.

**Key functions:**
- `submitOrder({ shopifyOrderId, email, cardItems, shippingAddress })` - Main entry point
- Creates order with card image URL for print-on-demand

**Printify API endpoint:**
```
POST https://api.printify.com/v1/shops/{shop_id}/orders.json
Headers:
  Authorization: Bearer {api_key}
  Content-Type: application/json
```

**Order payload structure:**
```javascript
{
  "external_id": "shopify-5678901234",  // Shopify order ID for reference
  "label": "AI Greeting Card Order",
  "line_items": [{
    "print_provider_id": 99,  // Print provider for greeting cards
    "blueprint_id": 1094,     // 5x7 greeting card blueprint
    "variant_id": 12345,      // Specific variant (size/paper)
    "print_areas": {
      "front": {
        "src": "https://s3.../card.png",  // AI-generated card image
        "scale": 1,
        "x": 0.5,
        "y": 0.5,
        "angle": 0
      }
    },
    "quantity": 1
  }],
  "shipping_method": 1,  // Standard shipping
  "send_shipping_notification": true,
  "address_to": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "customer@example.com",
    "phone": "",
    "country": "US",
    "region": "CA",
    "address1": "123 Main St",
    "address2": "",
    "city": "San Francisco",
    "zip": "94102"
  }
}
```

**Environment variables used:**
- `PRINTIFY_API_KEY` - Bearer token for API authentication
- `PRINTIFY_SHOP_ID` - Shop ID in API URL
- `PRINTIFY_CARD_BLUEPRINT_ID` - Blueprint ID for the card product

### 2. Update Shopify Webhook Handler

Replace the TODO in `src/lambda/handlers/shopify-webhook.js` with actual Printify submission.

**Changes:**
- Import printify-service
- Call `submitOrder()` after extracting card items
- Handle Printify API errors gracefully
- Log success/failure for monitoring

### 3. Handle Print Provider and Variant IDs

**Challenge:** Printify requires specific `print_provider_id` and `variant_id` values.

**Solution:**
- Query Printify API during development to get valid IDs
- Store them as environment variables or config
- Add `CM_PRINTIFY_PRINT_PROVIDER_ID` and `CM_PRINTIFY_VARIANT_ID` to .env

**API to get print providers:**
```
GET https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/print_providers.json
```

**API to get variants:**
```
GET https://api.printify.com/v1/catalog/blueprints/{blueprint_id}/print_providers/{print_provider_id}/variants.json
```

---

## API Specification

### Printify Create Order Response

**Success (200):**
```json
{
  "id": "5d39b159e7c48c000728c89f",
  "address_to": { ... },
  "line_items": [ ... ],
  "status": "pending",
  "created_at": "2024-01-15T10:30:00+00:00"
}
```

**Error (4xx/5xx):**
```json
{
  "error": "Error message",
  "errors": { "field": ["validation error"] }
}
```

---

## Critical Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/lambda/services/printify-service.js` | Create | Printify API order submission |
| `src/lambda/handlers/shopify-webhook.js` | Modify | Call Printify service |
| `.env.example` | Modify | Add print provider/variant IDs |
| `features/feature-plans/phase-4c.md` | Create | This plan |

---

## Implementation Order

1. Research Printify API for valid print provider and variant IDs
2. Create `printify-service.js`
3. Update `shopify-webhook.js` to call Printify
4. Update `.env.example` with new variables
5. Test end-to-end flow

---

## Testing

### Manual Testing

1. **Deploy to test environment:**
   ```bash
   npm run deploy:test
   ```

2. **Configure Shopify webhook** (if not already done)

3. **Complete a test checkout:**
   - Generate a card
   - Complete Shopify checkout
   - Verify webhook received in CloudWatch logs
   - Verify Printify order created in Printify dashboard

### Test Cases

- Valid order → Printify order created
- Missing card image → Log warning, skip Printify
- Printify API error → Log error, return 200 to Shopify (avoid retries)
- Invalid shipping address → Printify returns validation error

---

## Error Handling Strategy

**Important:** Always return 200 to Shopify webhooks, even on Printify failure.

- Shopify will retry failed webhooks (non-200 responses)
- Retrying won't help if Printify is down or data is invalid
- Log errors for manual intervention
- Consider storing failed orders for retry queue (future enhancement)

---

## Security Considerations

- **API key protection**: Stored in environment variable, never logged
- **Image URL access**: S3 presigned URLs may expire; ensure sufficient TTL
- **Order idempotency**: Use Shopify order ID as external_id to prevent duplicates

---

## Follow-up (Phase 5)

After Phase 4c is complete:
- Add Printify webhook handler for order status updates (optional)
- Add order status endpoint for frontend (optional)
- Comprehensive testing and guardrails review
