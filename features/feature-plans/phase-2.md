# Phase 2: Image Generation Service - Implementation Plan

## Overview
Implement the `/generate-card` endpoint that generates AI greeting card images using AWS Bedrock Titan Image Generator v2:0, stores them in S3, and returns a presigned URL.

## Current State
- **Infrastructure ready**: S3 image bucket, Bedrock permissions, Lambda configuration
- **Branch**: `feature/phase-2-image-generation`
- **Existing patterns**: Single handler.js with path-based routing, inline CORS handling

## Implementation Tasks

### 1. Create Service Layer Structure
Create modular services for image generation, S3 operations, and usage tracking.

**Files to create:**
```
src/lambda/
├── services/
│   ├── bedrock-image-service.js    # Bedrock Titan API calls
│   ├── s3-image-service.js         # S3 upload and presigned URLs
│   └── usage-tracker-service.js    # DynamoDB daily limits tracking
├── handlers/
│   └── generate-card.js            # /generate-card endpoint handler
└── handler.js                      # Update with new routing
```

### 2. Bedrock Image Service (`src/lambda/services/bedrock-image-service.js`)
- Use AWS SDK v3 `@aws-sdk/client-bedrock-runtime`
- Call `amazon.titan-image-generator-v2:0`
- Parameters from env vars: width (1024), height (1408), quality (premium)
- Note: Titan v2 max dimension is 1408px. 1024x1408 maintains ~5:7 aspect ratio
- Handle Bedrock errors gracefully
- Return base64-encoded image data

### 3. S3 Image Service (`src/lambda/services/s3-image-service.js`)
- Use AWS SDK v3 `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
- Upload image with key pattern: `cards/{uuid}.png`
- Generate presigned GET URL (4-hour expiry for preview, S3 lifecycle handles 48hr delete)
- Return imageId, imageUrl, expiresAt

### 4. Usage Tracker Service (`src/lambda/services/usage-tracker-service.js`)
- Use AWS SDK v3 `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb`
- Table: `cardmaker-usage-{env}` with partition key `dateKey` (YYYY-MM-DD)
- Track daily generation count with atomic increment
- Check limit before generation (50/day from MAX_DAILY_GENERATIONS env var)
- Return `{ allowed: boolean, currentCount: number, limit: number }`

### 5. Generate Card Handler (`src/lambda/handlers/generate-card.js`)
- Validate request body has `prompt` field
- Check daily limit via usage tracker (return 429 if exceeded)
- Call Bedrock service to generate image
- Increment usage counter on success
- Call S3 service to store and get presigned URL
- Return JSON: `{ imageId, imageUrl, expiresAt }`
- Handle errors with appropriate status codes

### 6. Update Main Handler (`src/lambda/handler.js`)
- Add route for `/generate-card` path
- Import and delegate to generate-card handler
- Follow existing routing pattern (path-based switch)

### 7. Update CDK Stack (`lib/cardmaker-stack.js`)
- Add DynamoDB table for usage tracking (`cardmaker-usage-{env}`)
  - Partition key: `dateKey` (String)
  - PAY_PER_REQUEST billing (cost-effective for POC)
  - TTL attribute for auto-cleanup of old records
- Grant Lambda read/write permissions to DynamoDB table
- Add `USAGE_TABLE_NAME` environment variable to Lambda
- Add `/generate-card` resource to API Gateway
- Configure throttling (5 req/min for POC)

### 8. Update Frontend
**Files to modify:**
- `public/config.js` - Add generate-card endpoint to API_ENDPOINTS
- `public/index.html` - Add card generator section (prompt input, preview, generate button)
- `public/card-generator.js` (new) - Generation UI logic
- `public/styles.css` - Card generator styling

### 9. Add Lambda Dependencies
Update `package.json` with AWS SDK v3 packages:
- `@aws-sdk/client-bedrock-runtime`
- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`
- `@aws-sdk/client-dynamodb`
- `@aws-sdk/lib-dynamodb`

### 10. Testing
- Add `tests/lambda-generate-card.js` for unit tests
- Test with local mock data
- Test deployed endpoint with curl

## Critical Files

| File | Action | Purpose |
|------|--------|---------|
| `src/lambda/services/bedrock-image-service.js` | Create | Bedrock API wrapper |
| `src/lambda/services/s3-image-service.js` | Create | S3 upload/presign wrapper |
| `src/lambda/services/usage-tracker-service.js` | Create | DynamoDB daily limits |
| `src/lambda/handlers/generate-card.js` | Create | Endpoint handler |
| `src/lambda/handler.js` | Modify | Add routing |
| `lib/cardmaker-stack.js` | Modify | Add DynamoDB table, API Gateway resource |
| `public/config.js` | Modify | Add endpoint config |
| `public/index.html` | Modify | Add UI section |
| `public/card-generator.js` | Create | Frontend logic |
| `public/styles.css` | Modify | Card generator styling |
| `package.json` | Modify | Add AWS SDK dependencies |

## API Specification

**POST /generate-card**
```json
Request:
{
  "prompt": "sunset over mountains with Happy Birthday text"
}

Response (200):
{
  "imageId": "550e8400-e29b-41d4-a716-446655440000",
  "imageUrl": "https://cardmaker-images-test.s3.../cards/550e8400....png?X-Amz-...",
  "expiresAt": "2025-12-20T18:30:00.000Z"
}

Error (400):
{
  "error": "Missing required field: prompt"
}

Error (429 - Rate Limited):
{
  "error": "Daily generation limit reached (50/day). Try again tomorrow."
}

Error (500):
{
  "error": "Image generation failed: [details]"
}
```

## Environment Variables
From `config/test.json` and CDK stack (already configured):
- `IMAGE_BUCKET_NAME` - S3 bucket for images
- `BEDROCK_REGION` - us-west-2
- `BEDROCK_IMAGE_MODEL` - amazon.titan-image-generator-v2:0
- `BEDROCK_IMAGE_WIDTH` - 1500
- `BEDROCK_IMAGE_HEIGHT` - 2100
- `BEDROCK_IMAGE_QUALITY` - premium
- `MAX_DAILY_GENERATIONS` - 50 (already in config)

New (to be added in CDK):
- `USAGE_TABLE_NAME` - DynamoDB table name for usage tracking

## Implementation Order
1. Add AWS SDK dependencies to package.json
2. Update cardmaker-stack.js - add DynamoDB table and API Gateway resource
3. Create bedrock-image-service.js
4. Create s3-image-service.js
5. Create usage-tracker-service.js
6. Create generate-card.js handler
7. Update main handler.js with routing
8. Update frontend (config.js, index.html, card-generator.js, styles.css)
9. Deploy to test environment
10. Test end-to-end

## Decisions Made
- Backend + Frontend implementation (full Phase 2)
- Include DynamoDB guardrails for daily generation limits
- Direct Bedrock service implementation (no abstract interface)
- Following existing patterns for CORS, error handling, environment detection
- Throttling at 5 req/min per method for POC protection
