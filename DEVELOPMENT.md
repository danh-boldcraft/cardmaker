# Development Guide

This guide covers local development, testing, deployment, and environment management for Cardmaker.

## Table of Contents
- [Local Development](#local-development)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Local Development

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up git hooks:**
   ```bash
   git config core.hooksPath .githooks
   ```

   This enables the pre-commit hook that prevents committing code with "nocheckin" markers.

3. **Set up environment variables:**
   ```bash
   # Copy the example file
   cp .env.example .env

   # Edit .env and add your API keys
   # See .env.example for required variables
   ```

4. **Run locally:**
   ```bash
   npm run local
   ```

   This starts:
   - Frontend: http://localhost:8080 (auto-opens browser)
   - Backend: http://localhost:3001 (multiply endpoint)

### Development Workflow

**Run backend and frontend together:**
```bash
npm run local
```

**Run them separately (recommended for debugging):**

Terminal 1 - Backend:
```bash
npm run backend
```

Terminal 2 - Frontend:
```bash
npm run dev:open
```

### Frontend Development

- **Auto-refresh**: Browser automatically reloads when you edit files
- **No build step**: Plain HTML/CSS/JavaScript
- **Edit files**: Make changes in `public/` directory and save

### Backend Debugging

**Debug with VS Code breakpoints:**

1. Open `src/lambda/handler.js`
2. Click on a line number to set a breakpoint
3. Open "Run and Debug" (Ctrl+Shift+D)
4. Select "Debug Local Backend"
5. Click green play button
6. Make a request - execution will pause at your breakpoint

**Test with curl:**
```bash
curl -X POST http://localhost:3001/multiply \
  -H "Content-Type: application/json" \
  -d '{"number": 5}'
```

**Run unit tests:**
```bash
npm test
```

### Local Environment Detection

The frontend automatically detects it's running locally and uses `http://localhost:3001/multiply` as the API endpoint. See `public/config.js` for configuration.

### Git Hooks

This project uses git hooks to enforce code quality standards:

**Pre-commit Hook:**
- Prevents committing code containing "nocheckin" markers
- Searches all staged files (case-insensitive)
- Lists which files contain the marker if found

**Marking Code as Work-in-Progress:**

To prevent accidentally committing unfinished or temporary code:

```javascript
// nocheckin - temporary debug code
console.log('Debug info:', data);
```

The commit will be blocked until you remove the "nocheckin" comment.

**Hook Setup:**

Hooks are stored in `.githooks/` and committed to the repository. Each developer needs to run this once after cloning:

```bash
git config core.hooksPath .githooks
```

This is included in the Quick Start instructions above.

---

## Environment Configuration

This project supports three separate environments:

### Local Environment
- **Purpose**: Development and debugging on your machine
- **Infrastructure**: No AWS resources (runs locally)
- **Frontend**: `http://localhost:8080`
- **Backend**: `http://localhost:3001`
- **Commands**: `npm run local`, `npm run dev`, `npm run backend`

### Test Environment
- **Purpose**: AWS-based testing before production
- **Infrastructure**: Separate AWS stack (`MultiplyStack-Test`)
- **Configuration**: `config/test.json`
- **Commands**: `npm run deploy:test`, `npm run destroy:test`
- **Secrets**: Set via environment variables (CM_MEMBERSTACK_PUBLIC_KEY, CM_MEMBERSTACK_SECRET_KEY)

### Production Environment
- **Purpose**: Live production deployment
- **Infrastructure**: Separate AWS stack (`MultiplyStack-Prod`)
- **Configuration**: `config/prod.json`
- **Commands**: `npm run deploy:prod`, `npm run destroy:prod`
- **Secrets**: Set via environment variables with production keys

### Environment Variables

All user-configurable environment variables use the `CM_` prefix.

**Environment-Specific Memberstack Keys (Required):**

Each environment has its own set of Memberstack keys for security and isolation:

- **Local Development:**
  - `CM_MEMBERSTACK_LOCAL_PUBLIC_KEY` - Memberstack public key for local dev
  - `CM_MEMBERSTACK_LOCAL_SECRET_KEY` - Memberstack secret key for local dev

- **Test Environment:**
  - `CM_MEMBERSTACK_TEST_PUBLIC_KEY` - Memberstack public key for test deployment
  - `CM_MEMBERSTACK_TEST_SECRET_KEY` - Memberstack secret key for test deployment

- **Production Environment:**
  - `CM_MEMBERSTACK_PROD_PUBLIC_KEY` - Memberstack public key for production
  - `CM_MEMBERSTACK_PROD_SECRET_KEY` - Memberstack secret key for production

**How it works:**
- `npm run local` → Uses `CM_MEMBERSTACK_LOCAL_*` keys
- `npm run deploy:test` → Uses `CM_MEMBERSTACK_TEST_*` keys
- `npm run deploy:prod` → Uses `CM_MEMBERSTACK_PROD_*` keys

**Typical setup:** Set LOCAL and TEST keys to the same Memberstack sandbox/test keys. Only PROD keys should use live Memberstack credentials.

**Optional:**
- `CM_PORT` - Local backend port (default: 3001)
- `CM_HOST` - Local backend host (default: localhost)

**Set by npm scripts:**
- `DEPLOY_ENV` - Environment to deploy (local/test/prod)

See `.env.example` for detailed examples.

---

## Deployment

### Prerequisites

1. **AWS CLI** configured with your credentials:
   ```bash
   aws configure
   ```

2. **Bootstrap CDK** (one-time per AWS account/region):
   ```bash
   npm run bootstrap
   ```

3. **Set environment-specific API keys in `.env`:**

   Copy `.env.example` to `.env` and fill in your actual keys:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your Memberstack keys for each environment:
   ```bash
   # Local (usually test/sandbox keys)
   CM_MEMBERSTACK_LOCAL_PUBLIC_KEY="pk_sb_..."
   CM_MEMBERSTACK_LOCAL_SECRET_KEY="ms_test_..."

   # Test (sandbox keys)
   CM_MEMBERSTACK_TEST_PUBLIC_KEY="pk_sb_..."
   CM_MEMBERSTACK_TEST_SECRET_KEY="ms_test_..."

   # Production (live keys)
   CM_MEMBERSTACK_PROD_PUBLIC_KEY="pk_live_..."
   CM_MEMBERSTACK_PROD_SECRET_KEY="ms_live_..."
   ```

   **Important:** Set this up once - the deployment scripts will automatically use the correct keys for each environment.

### Deploy to Test Environment

```bash
npm run deploy:test
```

After deployment, CDK outputs:
- `CloudFrontDomain` - Your HTTPS frontend URL
- `MultiplyEndpoint` - Your API endpoint
- `WebsiteUrl` - Full HTTPS URL to share

**Note:** First CloudFront deployment takes 5-10 minutes to propagate globally.

### Deploy to Production

1. **Ensure your `.env` has production keys set:**
   - Verify `CM_MEMBERSTACK_PROD_PUBLIC_KEY` and `CM_MEMBERSTACK_PROD_SECRET_KEY` are set to your live Memberstack credentials

2. **Deploy:**
   ```bash
   npm run deploy:prod
   ```

   The script automatically uses the production keys from your `.env` file - no manual switching needed!

3. **Test thoroughly** before sharing with users

### Updating After Deployment

If you make changes to the code:

1. Make your changes locally
2. Test with `npm run local`
3. Deploy: `npm run deploy:test` or `npm run deploy:prod`
4. Wait 1-2 minutes for CloudFront cache invalidation
5. Changes are live!

### Infrastructure Details

**What gets deployed:**
- **Lambda**: Node.js 20.x function with your handler code
- **API Gateway**: REST API with rate limiting (10 req/sec per endpoint)
- **S3**: Private bucket for static frontend files
- **CloudFront**: HTTPS CDN with free SSL certificate, global distribution
  - Automatic HTTP → HTTPS redirect
  - Aggressive caching for performance
  - Gzip/Brotli compression

**CloudFront Benefits:**
- ✅ HTTPS encryption (free SSL certificate)
- ✅ Global CDN (fast loading worldwide)
- ✅ Automatic caching
- ✅ Rate limiting protection

### Cleanup

Remove AWS resources to avoid charges:

```bash
# Destroy test environment
npm run destroy:test

# Destroy production environment (use with caution!)
npm run destroy:prod
```

---

## Testing

### Backend Unit Tests

**Run unit tests:**
```bash
npm test
```

**Watch mode (auto-run on changes):**
```bash
npm run test:watch
```

**Manual testing with curl:**
```bash
# Valid request
curl -X POST http://localhost:3001/multiply \
  -H "Content-Type: application/json" \
  -d '{"number": 5}'
# Response: {"input": 5, "result": 15}

# Error case
curl -X POST http://localhost:3001/multiply \
  -H "Content-Type: application/json" \
  -d '{}'
# Response: {"error": "Missing required field: number"}
```

### Frontend E2E Tests

End-to-end tests use **Playwright** to automate browser interactions, testing the complete user flow from input to result display.

#### Running E2E Tests Locally

**1. Start the local development server:**
```bash
# Terminal 1: Start frontend
npm run dev
```

**2. Run the tests:**
```bash
# Terminal 2: Run tests in headless mode
npm run test:frontend

# Or run with visible browser (for debugging)
npm run test:frontend:headed

# Or open Playwright UI (interactive mode)
npm run test:frontend:ui
```

#### Test Coverage

The E2E tests verify:
- ✅ Form submission with mouse clicks
- ✅ Correct calculation results displayed
- ✅ Loading states (spinner, disabled inputs)
- ✅ Error handling (network errors, API errors)
- ✅ Rate limit handling (HTTP 429 responses)
- ✅ Input validation
- ✅ Multiple numeric inputs (positive, negative, decimals, zero)
- ✅ Result updates on subsequent submissions

#### Test Configuration

Tests are configured in `playwright.config.js`:
- **Browsers**: Chromium, Firefox, WebKit (Safari)
- **Base URL**: http://localhost:8080 (configurable via `BASE_URL` env var)
- **Test Location**: `tests/frontend-*.spec.js`
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure

#### Running Tests Against Deployed Environments

To test against deployed AWS environments:

```bash
# Test against test environment
BASE_URL=https://YOUR_TEST_CLOUDFRONT_DOMAIN.cloudfront.net npm run test:frontend

# Test against production
BASE_URL=https://YOUR_PROD_CLOUDFRONT_DOMAIN.cloudfront.net npm run test:frontend
```

**Note:** When testing deployed environments, tests use **real backend APIs** instead of mocks. Ensure your API is deployed and functional.

#### Viewing Test Reports

```bash
# Open HTML report (after running tests)
npm run test:frontend:report
```

Reports include:
- Test execution timeline
- Screenshots on failure
- Video recordings on failure
- Detailed error traces

#### CI/CD Integration

E2E tests run automatically on GitHub Actions for:
- Push to `master` branch
- Pull requests to `master`
- Manual workflow triggers

Tests run in parallel across all three browsers (Chromium, Firefox, WebKit) and upload artifacts on failure.

### Testing Deployed Endpoints

Replace `YOUR_API_ENDPOINT` with the URL from deployment outputs:

```bash
curl -X POST YOUR_API_ENDPOINT/multiply \
  -H "Content-Type: application/json" \
  -d '{"number": 5}'
```

---

## Troubleshooting

### Local Development Issues

**"Port 3001 already in use"**

Solution 1: Use a different port
```bash
CM_PORT=3002 npm run backend
```

Solution 2: Kill the process
```bash
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3001 | xargs kill -9
```

**Frontend doesn't auto-refresh**

1. Close and restart: `npm run dev:open`
2. Hard refresh browser: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

**"Cannot find module" errors**

Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Deployment Issues

**"Config file not found: config/test.json"**

Ensure the config file exists:
```bash
ls config/test.json
```

**"Missing required environment variables"**

For test/prod deployments, set the CM_MEMBERSTACK variables:
```bash
export CM_MEMBERSTACK_PUBLIC_KEY="your_key"
export CM_MEMBERSTACK_SECRET_KEY="your_secret"
```

**"Unable to resolve AWS account"**

Configure AWS CLI:
```bash
aws configure
```

**"User is not authorized to perform: cloudformation:CreateStack"**

Ensure your AWS user has appropriate permissions (AdministratorAccess or specific CloudFormation/Lambda/APIGateway permissions).

### Runtime Issues

**Changes not appearing after deployment**

1. Wait 1-2 minutes for CloudFront cache invalidation
2. Hard refresh browser: Ctrl+F5 or Cmd+Shift+R
3. Clear browser cache

**API calls fail with CORS errors**

- CORS headers are configured in both Lambda handler and API Gateway
- Check browser console (F12) for specific error details
- Verify you're using the correct API endpoint

**Rate limit errors (HTTP 429)**

The API is rate-limited to 10 requests/second per endpoint. This is normal protection. Wait a moment and retry.

---

## Project Structure

```
.
├── public/                 # Frontend files
│   ├── index.html         # Main HTML page
│   ├── app.js             # Frontend logic
│   ├── config.js          # API endpoint configuration
│   └── styles.css         # Styling
├── src/
│   └── lambda/
│       └── handler.js     # Backend Lambda function
├── lib/
│   └── multiply-stack.js  # CDK infrastructure definition
├── bin/
│   └── app.js             # CDK app entry point
├── config/                # Environment configs
│   ├── local.json         # Local development settings
│   ├── test.json          # Test environment
│   └── prod.json          # Production (create from prod.json.example)
├── tests/                 # Test files
│   ├── lambda-handler.js  # Lambda unit tests
│   ├── api-rate-limit.js  # API Gateway rate limit test
│   └── frontend-form-submission.spec.js # Frontend E2E tests (Playwright)
├── local-server.js        # Local backend simulator
├── .env.example           # Environment variable template
└── package.json           # Dependencies and scripts
```

---

## Available Scripts

### Local Development
- `npm run local` - Start frontend and backend locally
- `npm run dev` - Start frontend only (localhost:8080)
- `npm run dev:open` - Start frontend and open browser
- `npm run backend` - Start backend only (localhost:3001)
- `npm run debug` - Start backend with debugger

### Testing
- `npm test` - Run backend unit tests
- `npm run test:watch` - Auto-run unit tests on file changes
- `npm run test:frontend` - Run frontend E2E tests (headless)
- `npm run test:frontend:headed` - Run E2E tests with visible browser
- `npm run test:frontend:ui` - Open Playwright UI (interactive mode)
- `npm run test:frontend:report` - View HTML test report

### Deployment
- `npm run deploy:test` - Deploy to test environment
- `npm run deploy:prod` - Deploy to production environment
- `npm run destroy:test` - Destroy test environment
- `npm run destroy:prod` - Destroy production environment

### CDK
- `npm run bootstrap` - Bootstrap CDK (one-time setup)
- `npm run synth` - Synthesize CloudFormation template

---

## Cost Estimate

AWS Free Tier eligible services:

- **Lambda**: 1M free requests/month, 400,000 GB-seconds of compute
- **API Gateway**: 1M free API calls/month (first 12 months)
- **S3**: 5GB storage, 20,000 GET requests/month
- **CloudFront**: 1TB data transfer, 10M requests/month

**Typical low-traffic usage**: Stays within free tier or ~$0.50/month.

---

## Security Best Practices

- ✅ Use test API keys in test environment, production keys in production
- ✅ Never commit `.env` files (they're gitignored)
- ✅ Store secrets in environment variables, not config files
- ✅ All config files in `config/` are safe to commit (no secrets)
- ✅ Test thoroughly in test environment before deploying to production

---

## Additional Resources

- AWS CDK Documentation: https://docs.aws.amazon.com/cdk/
- Lambda Best Practices: https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html
- CloudFront Documentation: https://docs.aws.amazon.com/cloudfront/
