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

## Quick Start

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete frontend deployment instructions.

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

2. Bootstrap your AWS account for CDK (only needed once per account/region):
   ```bash
   npm run bootstrap
   ```

## Local Testing

Test the Lambda function locally before deploying:

```bash
npm test
```

This will run several test cases to verify the function works correctly.

## Deployment

Deploy the service to AWS:

```bash
npm run deploy
```

The deployment process will:
1. Package the Lambda function
2. Create the CloudFormation stack
3. Deploy Lambda and API Gateway
4. Output the API endpoint URL

Save the API endpoint URL from the output - you'll need it to make requests.

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

- `npm run deploy` - Deploy the stack to AWS
- `npm run destroy` - Remove the stack from AWS
- `npm run synth` - Synthesize CloudFormation template
- `npm test` - Run local tests
- `npm run bootstrap` - Bootstrap CDK (one-time setup)

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
