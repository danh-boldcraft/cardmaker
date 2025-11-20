# Multiply Service

A simple serverless application that multiplies a number by 3, featuring a web frontend and backend API deployed on AWS.

## Architecture

- **Frontend**: Static website hosted on AWS S3, distributed via CloudFront with HTTPS
- **Backend**: AWS Lambda function that performs the multiplication
- **API Gateway**: REST API endpoint to access the service
- **CDN**: CloudFront for global distribution, caching, and HTTPS encryption
- **AWS CDK**: Infrastructure as Code for deployment

## Features

- ✅ **Secure HTTPS** - SSL/TLS encryption for all frontend traffic
- ✅ **Global CDN** - Fast loading from anywhere in the world
- ✅ **Rate Limiting** - API throttling (10 requests/sec) to prevent abuse
- ✅ **Serverless** - Auto-scaling, pay-per-use infrastructure
- ✅ **Modern UI** - Clean, responsive web interface
- ✅ **Multi-Environment** - Separate local, test, and production environments

## Quick Start

- **Local Development**: See [LOCAL-DEVELOPMENT.md](LOCAL-DEVELOPMENT.md)
- **Environment Setup**: See [ENVIRONMENTS.md](ENVIRONMENTS.md)
- **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or later)
   - Download from [nodejs.org](https://nodejs.org/)

2. **AWS CLI**
   - Install: `npm install -g aws-cli`
   - Configure with your credentials: `aws configure`
   - You'll need:
     - AWS Access Key ID
     - AWS Secret Access Key
     - Default region (e.g., us-east-1)

3. **AWS Account**
   - Create one at [aws.amazon.com](https://aws.amazon.com/) if you don't have one
   - Ensure you have permissions to create Lambda functions, API Gateway, and IAM roles

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables for local development:
   ```bash
   # Copy the example file
   cp .env.example .env

   # Edit .env and add your API keys (Stripe, Memberstack, etc.)
   # See .env.example for required variables
   ```

3. Bootstrap your AWS account for CDK (only needed once per account/region):
   ```bash
   npm run bootstrap
   ```

## Local Development

Run the complete application locally (frontend + backend):

```bash
npm run local
```

This starts both the frontend (localhost:8080) and backend (localhost:3001).

For detailed debugging instructions, see [LOCAL-DEVELOPMENT.md](LOCAL-DEVELOPMENT.md).

## Secrets Management

This project uses environment variables for all secrets (API keys, tokens, etc.):

- **Local Development**: Secrets are loaded from `.env` file (gitignored)
- **AWS Deployment**: Secrets are passed via environment variables to Lambda
- **No secrets in config files**: All config files are safe to commit

### Setting Up Secrets

1. Copy `.env.example` to `.env`
2. Fill in your test API keys in `.env`
3. Never commit the `.env` file (it's in `.gitignore`)

See [.env.example](.env.example) for required variables.

## Deployment

This project supports three environments:

- **Local**: Development on your machine (no AWS deployment)
- **Test**: AWS deployment for testing
- **Production**: Live AWS deployment

### Deploy to Test Environment

```bash
# Set environment variables before deploying
export MEMBERSTACK_SECRET_KEY="ms_test_..."

npm run deploy:test
```

### Deploy to Production

```bash
# Set environment variables with PRODUCTION keys before deploying
export MEMBERSTACK_SECRET_KEY="ms_live_..."

npm run deploy:prod
```

**Note**: Environment variables must be set in your shell before deploying. These secrets are passed to the Lambda function and are not stored in config files.

For complete environment setup and deployment instructions, see [ENVIRONMENTS.md](ENVIRONMENTS.md).

## Usage

Once deployed, you can call the API endpoint:

### Using curl (Command Line)

```bash
curl -X POST https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod/multiply \
  -H "Content-Type: application/json" \
  -d '{"number": 5}'
```

### Using PowerShell (Windows)

```powershell
Invoke-RestMethod -Uri "https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod/multiply" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"number": 5}'
```

### Request Format

```json
{
  "number": 5
}
```

### Response Format

Success response (200):
```json
{
  "input": 5,
  "result": 15
}
```

Error response (400):
```json
{
  "error": "Missing required field: number"
}
```

## Testing Examples

```bash
# Multiply 5 by 3
curl -X POST YOUR_ENDPOINT/multiply -H "Content-Type: application/json" -d '{"number": 5}'
# Response: {"input": 5, "result": 15}

# Multiply negative number
curl -X POST YOUR_ENDPOINT/multiply -H "Content-Type: application/json" -d '{"number": -3}'
# Response: {"input": -3, "result": -9}

# Multiply decimal
curl -X POST YOUR_ENDPOINT/multiply -H "Content-Type: application/json" -d '{"number": 7.5}'
# Response: {"input": 7.5, "result": 22.5}

# Error - missing number
curl -X POST YOUR_ENDPOINT/multiply -H "Content-Type: application/json" -d '{}'
# Response: {"error": "Missing required field: number"}
```

## Project Structure

```
.
├── bin/
│   └── app.js              # CDK app entry point
├── lib/
│   └── multiply-stack.js   # CDK stack definition
├── src/
│   └── lambda/
│       └── handler.js      # Lambda function code
├── cdk.json                # CDK configuration
├── package.json            # Node.js dependencies
├── test-local.js           # Local testing script
└── README.md               # This file
```

## Available Scripts

### Local Development
- `npm run local` - Start frontend and backend locally
- `npm run dev` - Start frontend only (localhost:8080)
- `npm run backend` - Start backend only (localhost:3001)
- `npm run debug` - Start backend with debugger

### Testing
- `npm test` - Run local tests

### Deployment
- `npm run deploy:test` - Deploy to test environment
- `npm run deploy:prod` - Deploy to production environment
- `npm run destroy:test` - Destroy test environment
- `npm run destroy:prod` - Destroy production environment

### CDK
- `npm run bootstrap` - Bootstrap CDK (one-time setup)
- `npm run synth` - Synthesize CloudFormation template

## Cleanup

To remove all AWS resources and avoid ongoing charges:

```bash
npm run destroy
```

Confirm the deletion when prompted.

## Cost

This service uses AWS Free Tier eligible services:
- **Lambda**: 1M free requests per month, 400,000 GB-seconds of compute
- **API Gateway**: 1M free API calls per month for 12 months

After Free Tier limits, costs are minimal for low usage (~$0.20 per 1M requests).

## Troubleshooting

### "Unable to resolve AWS account to use"
- Run `aws configure` to set up your AWS credentials

### "User is not authorized to perform: cloudformation:CreateStack"
- Ensure your AWS user has appropriate permissions (AdministratorAccess or CloudFormation/Lambda/APIGateway permissions)

### Claude is great

### "Endpoint returns 403 Forbidden"
- Check that your API was deployed successfully
- Verify you're using the correct endpoint URL from the deployment output

### "Test fails locally"
- Ensure Node.js is installed: `node --version`
- Check that dependencies are installed: `npm install`

## License

ISC

## Note

Claude is so much better than cursor
