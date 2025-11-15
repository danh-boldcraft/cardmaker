# Frontend Deployment Guide

## Overview
Your multiply service now includes a frontend web interface that allows users to input a number and see it multiplied by 3.

## Architecture
- **Frontend**: Static website hosted on AWS S3, distributed via CloudFront CDN with HTTPS
- **Backend**: AWS Lambda + API Gateway
- **CDN**: CloudFront for global distribution, caching, and HTTPS encryption
- **Deployment**: AWS CDK

## Before You Deploy

### Step 1: Update API Endpoint Configuration

1. Open `public/config.js`
2. Replace `YOUR_API_ENDPOINT_HERE/multiply` with your actual API Gateway endpoint
3. You can find your endpoint by running:
   ```bash
   npm run deploy
   ```
   Look for the output `MultiplyStack.MultiplyEndpoint`

**Example config.js:**
```javascript
const API_CONFIG = {
    endpoint: 'https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/multiply'
};
```

## Deployment Steps

### 1. Deploy Everything to AWS

Since you've already deployed the backend, you can update the stack with the frontend:

```bash
npm run deploy
```

This will:
- Update your existing Lambda and API Gateway (if needed)
- Create an S3 bucket for static website hosting (private)
- Create a CloudFront distribution with HTTPS enabled
- Upload your frontend files (HTML, CSS, JS) to S3
- Automatically invalidate CloudFront cache on updates

**Note:** CloudFront distribution creation takes ~5-10 minutes on first deployment.

### 2. Get Your Website URL

After deployment completes, look for the output:
```
MultiplyStack.WebsiteUrl = https://d2ohaeiivgnrqq.cloudfront.net
```

This is your frontend URL!

### 3. Test Your Application

1. Open the Website URL in your browser
2. Enter a number (e.g., 5)
3. Click "Multiply by 3"
4. You should see the result (15)

## Deployment Outputs

After running `npm run deploy`, you'll see four important URLs:

1. **ApiUrl**: Your API Gateway base URL
2. **MultiplyEndpoint**: Your complete API endpoint (use this in config.js)
3. **WebsiteUrl**: Your HTTPS frontend website URL (share this with users)
4. **CloudFrontDomain**: Your CloudFront distribution domain

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

To remove all AWS resources (frontend + backend):

```bash
npm run destroy
```

This will:
- Delete the S3 bucket and all frontend files
- Remove the Lambda function
- Delete the API Gateway
- Clean up all associated resources

## Cost

Both frontend and backend use AWS Free Tier eligible services:
- **S3**: 5GB free storage, 20,000 GET requests/month
- **Lambda**: 1M free requests/month
- **API Gateway**: 1M free API calls/month (first 12 months)

After Free Tier, costs are minimal for low traffic (~$0.50/month for typical usage).

## Next Steps

### Production Enhancements (Optional)

1. **Custom Domain**: Set up a custom domain with Route53
2. **HTTPS**: Add CloudFront for HTTPS support
3. **Caching**: Enable CloudFront caching for better performance
4. **Authentication**: Add API key or Cognito authentication
5. **Monitoring**: Set up CloudWatch alarms and dashboards

### Local Development

You can also test the frontend locally:

1. Update `public/config.js` with your deployed API endpoint
2. Open `public/index.html` directly in your browser
3. Or use a local server:
   ```bash
   npx http-server public
   ```

## Support

- CDK Documentation: https://docs.aws.amazon.com/cdk/
- S3 Static Websites: https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html
- API Gateway CORS: https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html
