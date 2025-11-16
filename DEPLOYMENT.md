# Deployment Guide

## Overview

This project supports **three separate environments**: local, test, and production. Each environment has its own AWS stack and configuration.

**📚 For complete environment setup instructions, see [ENVIRONMENTS.md](ENVIRONMENTS.md)**

This guide covers the basic deployment workflow.

## Architecture
- **Frontend**: Static website hosted on AWS S3, distributed via CloudFront CDN with HTTPS
- **Backend**: AWS Lambda + API Gateway
- **CDN**: CloudFront for global distribution, caching, and HTTPS encryption
- **Deployment**: AWS CDK

## Environment Overview

### Local Environment
- No AWS deployment required
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3001`
- Start with: `npm run local`
- See [LOCAL-DEVELOPMENT.md](LOCAL-DEVELOPMENT.md)

### Test Environment
- AWS stack: `MultiplyStack-Test`
- Configuration: `config/test.json`
- Deploy with: `npm run deploy:test`
- Safe to experiment and test

### Production Environment
- AWS stack: `MultiplyStack-Prod`
- Configuration: `config/prod.json` (gitignored)
- Deploy with: `npm run deploy:prod`
- Live user-facing environment

## Deployment Steps

### First Time Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Bootstrap CDK** (one-time per AWS account/region):
   ```bash
   npm run bootstrap
   ```

3. **Create production config** (if deploying to prod):
   ```bash
   cp config/prod.json.example config/prod.json
   # Edit config/prod.json with your production secrets
   ```

### Deploy to Test Environment

1. **Deploy the stack**:
   ```bash
   npm run deploy:test
   ```

2. **Note the outputs**:
   ```
   MultiplyStack-Test.CloudFrontDomain = d1234test.cloudfront.net
   MultiplyStack-Test.MultiplyEndpoint = https://abc123.execute-api.us-west-2.amazonaws.com/prod/multiply
   MultiplyStack-Test.WebsiteUrl = https://d1234test.cloudfront.net
   ```

3. **Update frontend config** in `public/config.js`:
   ```javascript
   const API_ENDPOINTS = {
     local: 'http://localhost:3001/multiply',
     test: 'https://abc123.execute-api.us-west-2.amazonaws.com/prod/multiply',  // ← UPDATE
     prod: 'https://xyz789.execute-api.us-west-2.amazonaws.com/prod/multiply'
   };

   const CLOUDFRONT_DOMAINS = {
     test: 'd1234test.cloudfront.net',  // ← UPDATE
     prod: 'd5678prod.cloudfront.net'
   };
   ```

4. **Redeploy** to update frontend with new config:
   ```bash
   npm run deploy:test
   ```

5. **Test your application** at the CloudFront URL

**Note:** First CloudFront deployment takes ~5-10 minutes.

### Deploy to Production

1. **Ensure `config/prod.json` is configured** with production secrets

2. **Deploy** (requires confirmation for safety):
   ```bash
   npm run deploy:prod
   ```

3. **Update frontend config** with production endpoints

4. **Redeploy**:
   ```bash
   npm run deploy:prod
   ```

5. **Test thoroughly** before sharing with users

## Deployment Outputs

After running `npm run deploy:test` or `npm run deploy:prod`, you'll see:

1. **Environment**: Which environment was deployed (test/prod)
2. **ApiUrl**: Your API Gateway base URL
3. **MultiplyEndpoint**: Complete API endpoint → update in `public/config.js`
4. **WebsiteUrl**: Your HTTPS frontend URL → share with users
5. **CloudFrontDomain**: CloudFront domain → update in `public/config.js`

## CloudFront Benefits

Your site now uses CloudFront CDN, providing:
- ✅ **HTTPS encryption** - Secure, with padlock in browser
- ✅ **Global CDN** - Fast loading from anywhere in the world
- ✅ **Automatic caching** - Reduced costs and improved performance
- ✅ **Compression** - Gzip/Brotli for faster transfers
- ✅ **Free SSL certificate** - Automatically provisioned by AWS

## Updating the Frontend

If you make changes to the frontend files (HTML, CSS, or JavaScript):

1. Make your changes in the `public/` directory
2. Run `npm run deploy` again
3. CDK will automatically:
   - Upload the updated files to S3
   - Invalidate the CloudFront cache
   - Make your changes live immediately

**Note:** CloudFront cache invalidation may take 1-2 minutes to propagate globally.

## Project Structure

```
.
├── public/                 # Frontend files
│   ├── index.html         # Main HTML page
│   ├── styles.css         # Styling
│   ├── app.js             # Application logic
│   └── config.js          # API endpoint configuration ⚠️ UPDATE THIS!
├── src/
│   └── lambda/
│       └── handler.js     # Backend Lambda function
├── lib/
│   └── multiply-stack.js  # CDK infrastructure
└── bin/
    └── app.js             # CDK app entry point
```

## Troubleshooting

### "API endpoint not configured" Error
- Update `public/config.js` with your actual API Gateway endpoint URL
- Redeploy: `npm run deploy`

### Frontend shows but API calls fail
1. Check browser console (F12) for errors
2. Verify the endpoint in `config.js` is correct
3. Ensure your backend is deployed and working
4. Test the backend directly with curl:
   ```bash
   curl -X POST YOUR_ENDPOINT/multiply -H "Content-Type: application/json" -d '{"number": 5}'
   ```

### CORS errors
- The Lambda handler already includes CORS headers (`Access-Control-Allow-Origin: *`)
- API Gateway has CORS enabled in the CDK stack
- If issues persist, check the browser console for specific CORS errors

### Changes not appearing after deployment
1. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cache
3. Verify the deployment completed successfully

## Cleanup

Remove AWS resources for a specific environment:

```bash
# Destroy test environment
npm run destroy:test

# Destroy production environment (use with caution!)
npm run destroy:prod
```

This will delete all resources including S3 bucket, Lambda, API Gateway, and CloudFront distribution.

## Cost

Both frontend and backend use AWS Free Tier eligible services:
- **S3**: 5GB free storage, 20,000 GET requests/month
- **Lambda**: 1M free requests/month
- **API Gateway**: 1M free API calls/month (first 12 months)

After Free Tier, costs are minimal for low traffic (~$0.50/month for typical usage).

## Related Documentation

- **[ENVIRONMENTS.md](ENVIRONMENTS.md)** - Complete environment setup guide
- **[LOCAL-DEVELOPMENT.md](LOCAL-DEVELOPMENT.md)** - Local debugging guide
- **[README.md](README.md)** - Project overview
- **[RATE-LIMITING.md](RATE-LIMITING.md)** - API throttling details

## Support

- CDK Documentation: https://docs.aws.amazon.com/cdk/
- S3 Static Websites: https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html
- API Gateway CORS: https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html
