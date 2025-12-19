# Cardmaker v0.1 POC - System Flow

## Complete End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER INTERACTION FLOW                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 1. User enters text prompt for AI greeting card                     │
│    ↓                                                                │
│ POST /generate-card                                                 │
│    ├─ Validate prompt                                              │
│    ├─ Check daily generation limit (50/day via DynamoDB)           │
│    ├─ Call Bedrock Titan Image Generator                           │
│    │   ├─ Model: amazon.titan-image-generator-v1                   │
│    │   ├─ Dimensions: 1500x2100 pixels (5x7" at 300 DPI)           │
│    │   └─ Quality: premium                                         │
│    ├─ Upload generated image to S3                                 │
│    │   ├─ Bucket: cardmaker-images                                 │
│    │   ├─ Lifecycle: 48-hour expiration                            │
│    │   └─ Key: cards/{uuid}.png                                    │
│    └─ Return presigned URL to frontend                             │
│                                                                     │
│    Response: {                                                      │
│      "imageId": "550e8400-e29b-41d4-a716-446655440000",            │
│      "imageUrl": "https://s3.../card.png?X-Amz-...",              │
│      "expiresAt": "2025-12-20T14:30:00Z"                           │
│    }                                                                │
│    ↓                                                                │
│ 2. Frontend displays 5x7 card preview                               │
│    ↓                                                                │
│ 3. User fills shipping address and clicks "Buy This Card"          │
│    ↓                                                                │
│ POST /checkout                                                      │
│    ├─ Validate shipping address                                    │
│    ├─ Check daily order limit (10/day via DynamoDB)                │
│    ├─ Create Shopify Draft Order                                   │
│    │   ├─ Product: "Custom AI Greeting Card" (from Shopify)        │
│    │   ├─ Line item properties:                                    │
│    │   │   ├─ "Card Image URL": "{S3 presigned URL}"              │
│    │   │   └─ "Card Image ID": "{uuid}"                           │
│    │   ├─ Shipping address from user input                         │
│    │   └─ Email for notifications                                  │
│    └─ Return Shopify checkout URL                                  │
│                                                                     │
│    Response: {                                                      │
│      "orderId": "shopify-draft-order-123",                         │
│      "checkoutUrl": "https://getbrocards.myshopify.com/..."        │
│    }                                                                │
│    ↓                                                                │
│ 4. User redirected to Shopify checkout page                         │
│    ↓                                                                │
│ 5. User completes payment via Shopify                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ AUTOMATED BACKEND FULFILLMENT FLOW                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 6. Shopify payment completed                                        │
│    ↓                                                                │
│    Shopify webhook triggers: orders/paid                            │
│    ↓                                                                │
│ POST /webhooks/shopify/orders/paid                                  │
│    ├─ Verify HMAC signature (security)                             │
│    │   └─ Uses CM_SHOPIFY_WEBHOOK_SECRET                           │
│    ├─ Extract order data:                                          │
│    │   ├─ Order ID: "5678901234"                                   │
│    │   ├─ Customer shipping address                                │
│    │   ├─ Customer email                                           │
│    │   └─ Line item properties:                                    │
│    │       └─ "Card Image URL": "https://s3.../card.png"          │
│    ├─ Call Printify fulfillment service                            │
│    └─ Log order submission                                         │
│    ↓                                                                │
│ POST https://api.printify.com/v1/shops/{shop_id}/orders.json       │
│    Headers:                                                         │
│    ├─ Authorization: Bearer {CM_PRINTIFY_API_KEY}                  │
│    └─ Content-Type: application/json                               │
│                                                                     │
│    Body: {                                                          │
│      "external_id": "shopify-5678901234",                          │
│      "line_items": [{                                               │
│        "product_id": "{CM_PRINTIFY_CARD_BLUEPRINT_ID}",            │
│        "variant_id": "{5x7_variant_id}",                           │
│        "quantity": 1,                                               │
│        "print_areas": {                                             │
│          "front": "https://s3.../card.png"  ← AI-generated image   │
│        }                                                            │
│      }],                                                            │
│      "shipping_method": 1,                                          │
│      "address_to": {                                                │
│        "first_name": "John",                                        │
│        "last_name": "Doe",                                          │
│        "email": "john@example.com",                                 │
│        "phone": "+1234567890",                                      │
│        "country": "US",                                             │
│        "region": "CA",                                              │
│        "address1": "123 Main St",                                   │
│        "city": "San Francisco",                                     │
│        "zip": "94102"                                               │
│      }                                                              │
│    }                                                                │
│    ↓                                                                │
│ 7. Printify confirms order                                          │
│    Response: {                                                      │
│      "id": "printify-order-789",                                    │
│      "status": "pending"                                            │
│    }                                                                │
│    ↓                                                                │
│ 8. Printify prints 5x7 greeting card                                │
│    ├─ Downloads image from S3 presigned URL                        │
│    ├─ Validates print quality                                      │
│    └─ Sends to production                                          │
│    ↓                                                                │
│ 9. Printify ships card to customer                                  │
│    ↓                                                                │
│ 10. (Optional) Printify webhook triggers: order:shipped             │
│     ↓                                                               │
│     POST /webhooks/printify/order-status                            │
│     ├─ Update DynamoDB with tracking number                        │
│     └─ (Future) Email customer with tracking                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Architecture Diagram

```
┌──────────────┐
│   Browser    │
│   (User)     │
└──────┬───────┘
       │
       │ HTTPS
       ↓
┌──────────────┐
│  AWS WAF     │ ← IP Allowlist (CM_ALLOWED_IPS)
│  (CloudFront)│
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       ↓                 ↓
┌──────────────┐  ┌──────────────┐
│  S3 Bucket   │  │ API Gateway  │
│  (Frontend)  │  │  (Backend)   │
│ index.html   │  └──────┬───────┘
│ card-generator.js │     │
│ styles.css   │         │ Route dispatch
└──────────────┘         │
                         ↓
                  ┌──────────────┐
                  │   Lambda     │
                  │   Handler    │
                  └──────┬───────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ↓                ↓                ↓
  /generate-card    /checkout    /webhooks/shopify
        │                │                │
        │                │                │
        ↓                │                ↓
  ┌──────────┐           │         ┌──────────────┐
  │ Bedrock  │           │         │ Verify HMAC  │
  │  Titan   │           │         │  Signature   │
  └────┬─────┘           │         └──────┬───────┘
       │                 │                │
       ↓                 ↓                │
  ┌──────────┐    ┌──────────────┐       │
  │ S3 Images│    │   Shopify    │       │
  │ (48hr    │    │ Draft Order  │       │
  │  expire) │    │     API      │       │
  └──────────┘    └──────────────┘       │
                                         │
                  Shopify Checkout       │
                         │               │
                         ↓               │
                  User Pays              │
                         │               │
                         └───────────────┘
                                 │
                                 ↓
                         ┌──────────────┐
                         │  Printify    │
                         │     API      │
                         └──────┬───────┘
                                │
                                ↓
                         Print & Ship Card
```

## Security Layers

```
┌─────────────────────────────────────┐
│ Layer 1: WAF IP Allowlist           │
│ - Blocks all IPs except CM_ALLOWED  │
│ - Applied at CloudFront edge        │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Layer 2: API Gateway Throttling     │
│ - 5 requests/minute per IP          │
│ - Prevents API abuse                │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Layer 3: DynamoDB Spending Limits   │
│ - 50 generations/day (global)       │
│ - 10 orders/day (global)            │
│ - Prevents runaway costs            │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ Layer 4: Webhook HMAC Verification  │
│ - Validates Shopify webhooks        │
│ - Prevents forged requests          │
└─────────────────────────────────────┘
```

## Data Flow: Image Lifecycle

```
1. Generation:
   Bedrock → Lambda → S3 bucket

2. Display:
   S3 presigned URL (4hr expiry) → Browser preview

3. Checkout:
   S3 URL → Shopify line item property

4. Fulfillment:
   Shopify webhook → Lambda → Printify API
   (Printify downloads from S3 presigned URL)

5. Cleanup:
   S3 lifecycle policy deletes after 48 hours
```

## Environment-Specific Endpoints

### Local Development
```
Frontend: http://localhost:8080
Backend:  http://localhost:3001
Webhooks: Not available (Shopify can't reach localhost)
```

### Test Environment
```
Frontend: https://d1km502pp6onh8.cloudfront.net
Backend:  https://imjd82jn21.execute-api.us-west-2.amazonaws.com/api
Webhooks: https://imjd82jn21.execute-api.us-west-2.amazonaws.com/api/webhooks/shopify/orders/paid
```

### Production Environment
```
Frontend: https://d1tc1pwgiayrtm.cloudfront.net
Backend:  https://1injnhd53d.execute-api.us-west-2.amazonaws.com/api
Webhooks: https://1injnhd53d.execute-api.us-west-2.amazonaws.com/api/webhooks/shopify/orders/paid
```

## Testing Flow

### Manual Testing
1. Generate card → Check S3 bucket for image
2. Click "Buy" → Verify Shopify draft order created
3. Complete Shopify checkout → Check webhook received
4. Verify Printify order created → Check Printify dashboard

### Automated Testing
1. Unit tests: `npm test`
   - Test image generation
   - Test HMAC verification
   - Test Printify API calls

2. E2E tests: `npx playwright test`
   - Full user flow simulation
   - Mock Shopify/Printify APIs
