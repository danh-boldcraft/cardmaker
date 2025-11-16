# Environment Management Guide

This project supports three separate environments: **local**, **test**, and **production**. Each environment has its own configuration, AWS resources, and deployment workflow.

## Overview

### Local Environment
- **Purpose**: Local development and debugging
- **Infrastructure**: Runs on your machine (no AWS resources)
- **Frontend**: `http://localhost:8080`
- **Backend**: `http://localhost:3001`
- **Configuration**: `config/local.json`
- **Commands**: `npm run local`, `npm run dev`, `npm run backend`

### Test Environment
- **Purpose**: AWS-based testing before production
- **Infrastructure**: Separate AWS CloudFormation stack (`MultiplyStack-Test`)
- **CloudFront**: Test-specific distribution
- **API Gateway**: Test-specific endpoint
- **Configuration**: `config/test.json`
- **Commands**: `npm run deploy:test`, `npm run destroy:test`
- **Safe to commit**: Yes (uses test API keys)

### Production Environment
- **Purpose**: Live production deployment
- **Infrastructure**: Separate AWS CloudFormation stack (`MultiplyStack-Prod`)
- **CloudFront**: Production distribution
- **API Gateway**: Production endpoint
- **Configuration**: `config/prod.json` (gitignored for security)
- **Commands**: `npm run deploy:prod`, `npm run destroy:prod`
- **Safe to commit**: NO - contains live secrets

## Configuration Files

```
config/
├── local.json           # Local development settings
├── test.json            # Test environment (AWS)
├── prod.json.example    # Template for production
└── prod.json            # Production secrets (gitignored)
```

### Creating Your Production Config

1. Copy the example file:
   ```bash
   cp config/prod.json.example config/prod.json
   ```

2. Update `config/prod.json` with your production secrets:
   - Stripe live keys (`pk_live_...`, `sk_live_...`)
   - Memberstack live keys
   - Any other production-specific settings

3. **NEVER commit `config/prod.json`** - it's protected by `.gitignore`

## Deployment Workflows

### Deploying to Test Environment

1. **Deploy the stack**:
   ```bash
   npm run deploy:test
   ```

2. **After deployment**, CDK will output:
   - `CloudFrontDomain`: e.g., `d1234test.cloudfront.net`
   - `MultiplyEndpoint`: e.g., `https://abc123.execute-api.us-west-2.amazonaws.com/prod/multiply`

3. **Update frontend configuration** in `public/config.js`:
   ```javascript
   const API_ENDPOINTS = {
     local: 'http://localhost:3001/multiply',
     test: 'https://abc123.execute-api.us-west-2.amazonaws.com/prod/multiply',  // ← UPDATE THIS
     prod: 'https://xyz789.execute-api.us-west-2.amazonaws.com/prod/multiply'
   };

   const CLOUDFRONT_DOMAINS = {
     test: 'd1234test.cloudfront.net',  // ← UPDATE THIS
     prod: 'd5678prod.cloudfront.net'
   };
   ```

4. **Redeploy** to update the frontend with new config:
   ```bash
   npm run deploy:test
   ```

5. **Test your application** at `https://d1234test.cloudfront.net`

### Deploying to Production

1. **Ensure `config/prod.json` exists** with live secrets

2. **Deploy with extra confirmation** (requires approval):
   ```bash
   npm run deploy:prod
   ```

3. **Update frontend configuration** in `public/config.js` with production endpoints

4. **Redeploy** to update the frontend:
   ```bash
   npm run deploy:prod
   ```

5. **Test your application** at the production CloudFront URL

### Destroying Environments

⚠️ **Warning**: This deletes all AWS resources for the environment!

```bash
# Destroy test environment
npm run destroy:test

# Destroy production environment (use with caution!)
npm run destroy:prod
```

## Environment Detection

The frontend automatically detects which environment it's running in:

### Detection Logic (`public/config.js`)

```javascript
function detectEnvironment() {
  const hostname = window.location.hostname;

  // localhost:8080 → local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'local';
  }

  // Test CloudFront domain → test
  if (hostname === CLOUDFRONT_DOMAINS.test) {
    return 'test';
  }

  // Production CloudFront domain → prod
  if (hostname === CLOUDFRONT_DOMAINS.prod) {
    return 'prod';
  }

  // Default to production for safety
  return 'prod';
}
```

### How It Works

1. User visits `https://d1234test.cloudfront.net`
2. Frontend detects hostname matches `CLOUDFRONT_DOMAINS.test`
3. Sets `API_CONFIG.environment = 'test'`
4. Uses `API_ENDPOINTS.test` for API calls
5. Enables debug mode (`API_CONFIG.debug = true`)

## Local Development

Local development is **completely independent** of AWS deployments:

```bash
# Start both frontend and backend
npm run local

# Or run them separately:
npm run dev        # Frontend only (localhost:8080)
npm run backend    # Backend only (localhost:3001)

# Debug the backend
npm run debug      # Starts with Node.js debugger
```

See [LOCAL-DEVELOPMENT.md](./LOCAL-DEVELOPMENT.md) for details.

## Configuration Structure

### Lambda Settings
```json
{
  "lambda": {
    "memorySize": 128,      // MB of memory
    "timeout": 10,          // seconds
    "reservedConcurrency": null
  }
}
```

### API Gateway Throttling
```json
{
  "apiGateway": {
    "throttling": {
      "rateLimit": 100,     // requests per second (global)
      "burstLimit": 200     // burst capacity
    },
    "methodThrottling": {
      "rateLimit": 10,      // requests per second (per endpoint)
      "burstLimit": 20
    }
  }
}
```

### CloudFront Settings
```json
{
  "cloudfront": {
    "priceClass": "PriceClass_100",  // or PriceClass_All for prod
    "comment": "Test environment - Multiply Service"
  }
}
```

### Feature Flags
```json
{
  "features": {
    "debugMode": true,        // Enable debug logging
    "verboseLogging": true    // Detailed logs
  }
}
```

### Secrets (Production Only)
```json
{
  "secrets": {
    "stripe": {
      "publicKey": "pk_live_YOUR_KEY_HERE",
      "secretKey": "sk_live_YOUR_KEY_HERE"
    },
    "memberstack": {
      "publicKey": "pk_live_YOUR_KEY_HERE",
      "secretKey": "ms_live_YOUR_KEY_HERE"
    }
  }
}
```

## Security Best Practices

### ✅ DO
- Keep test API keys in `config/test.json` (safe to commit)
- Use `config/prod.json.example` as a template
- Store production secrets in `config/prod.json` (gitignored)
- Use different Stripe/Memberstack accounts for test vs prod
- Test thoroughly in test environment before deploying to prod

### ❌ DON'T
- Commit `config/prod.json` to version control
- Use production secrets in test environment
- Deploy to production without testing first
- Share production API keys in Slack/email
- Use the same database for test and prod

## Troubleshooting

### Frontend Shows Wrong Environment

**Problem**: Frontend uses wrong API endpoint

**Solution**: Check `public/config.js` and verify:
1. `CLOUDFRONT_DOMAINS` matches your actual CloudFront distributions
2. `API_ENDPOINTS` are updated with correct URLs from CDK outputs

### Deployment Fails: "Config file not found"

**Problem**: `config/prod.json` or `config/test.json` missing

**Solution**:
```bash
# For production
cp config/prod.json.example config/prod.json
# Edit config/prod.json with your secrets

# For test (should already exist)
ls config/test.json
```

### "REPLACE_WITH_TEST_API_ENDPOINT" Warning

**Problem**: Frontend config not updated after deployment

**Solution**: After `npm run deploy:test`, update `public/config.js` with:
- `MultiplyEndpoint` → `API_ENDPOINTS.test`
- `CloudFrontDomain` → `CLOUDFRONT_DOMAINS.test`

Then redeploy: `npm run deploy:test`

## Next Steps

1. **First Time Setup**:
   - Create `config/prod.json` from template
   - Deploy to test: `npm run deploy:test`
   - Update `public/config.js` with test URLs
   - Redeploy: `npm run deploy:test`
   - Test at CloudFront URL

2. **Future Updates**:
   - Make changes locally
   - Test with `npm run local`
   - Deploy to test: `npm run deploy:test`
   - Verify in test environment
   - Deploy to prod: `npm run deploy:prod`

## Related Documentation

- [LOCAL-DEVELOPMENT.md](./LOCAL-DEVELOPMENT.md) - Local debugging guide
- [README.md](./README.md) - Project overview
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
