# Multiply Service

A simple serverless application that multiplies a number by 3, featuring a web frontend and backend API deployed on AWS.

## Features

- ✅ **Secure HTTPS** - SSL/TLS encryption for all frontend traffic via CloudFront
- ✅ **Global CDN** - Fast loading from anywhere in the world
- ✅ **Rate Limiting** - API throttling (10 requests/sec) to prevent abuse
- ✅ **Serverless** - Auto-scaling, pay-per-use infrastructure
- ✅ **Modern UI** - Clean, responsive web interface
- ✅ **Multi-Environment** - Separate local, test, and production environments

## Architecture

- **Frontend**: Static website hosted on AWS S3, distributed via CloudFront with HTTPS
- **Backend**: AWS Lambda function (Node.js 20.x) that performs the multiplication
- **API Gateway**: REST API endpoint with CORS and rate limiting
- **CDN**: CloudFront for global distribution, caching, and HTTPS encryption
- **Infrastructure as Code**: AWS CDK for repeatable deployments

## Quick Start

### Prerequisites

- **Node.js** v18 or later ([nodejs.org](https://nodejs.org/))
- **AWS CLI** configured with credentials ([AWS CLI setup](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))
- **AWS Account** with permissions for Lambda, API Gateway, S3, CloudFront

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys (see .env.example for details)

# Run locally
npm run local
```

This starts the frontend at http://localhost:8080 and backend at http://localhost:3001.

For detailed development and deployment instructions, see **[DEVELOPMENT.md](DEVELOPMENT.md)**.

## Usage

### API Endpoint

**POST** `/multiply`

**Request:**
```json
{
  "number": 5
}
```

**Response:**
```json
{
  "input": 5,
  "result": 15
}
```

**Error Response:**
```json
{
  "error": "Missing required field: number"
}
```

### Examples

```bash
# Using curl
curl -X POST YOUR_API_ENDPOINT/multiply \
  -H "Content-Type: application/json" \
  -d '{"number": 5}'

# Using PowerShell
Invoke-RestMethod -Uri "YOUR_API_ENDPOINT/multiply" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"number": 5}'
```

## Available Scripts

### Local Development
- `npm run local` - Run frontend and backend locally
- `npm run dev` - Start frontend only (localhost:8080)
- `npm run backend` - Start backend only (localhost:3001)
- `npm test` - Run unit tests

### Deployment
- `npm run deploy:test` - Deploy to test environment
- `npm run deploy:prod` - Deploy to production environment
- `npm run bootstrap` - Bootstrap CDK (one-time setup)

See [DEVELOPMENT.md](DEVELOPMENT.md) for complete documentation.

## Environment Variables

All user-configurable environment variables use the `CT_` prefix:

- `CT_MEMBERSTACK_PUBLIC_KEY` - Memberstack public API key (required)
- `CT_MEMBERSTACK_SECRET_KEY` - Memberstack secret API key (required)
- `CT_PORT` - Local backend port (optional, default: 3001)
- `CT_HOST` - Local backend host (optional, default: localhost)

Copy `.env.example` to `.env` and fill in your values.

## Project Structure

```
.
├── bin/
│   └── app.js              # CDK app entry point
├── lib/
│   └── multiply-stack.js   # CDK stack definition (infrastructure)
├── src/
│   └── lambda/
│       └── handler.js      # Lambda function code
├── public/                 # Frontend files
│   ├── index.html          # Main page
│   ├── app.js              # Frontend logic
│   ├── config.js           # Environment detection
│   └── styles.css          # Styling
├── config/                 # Environment configs (local, test, prod)
├── local-server.js         # Local backend simulator
├── test-local.js           # Unit tests
├── package.json            # Dependencies and scripts
├── README.md               # This file
└── DEVELOPMENT.md          # Development and deployment guide
```

## Cost

This service uses AWS Free Tier eligible services:

- **Lambda**: 1M free requests/month, 400,000 GB-seconds of compute
- **API Gateway**: 1M free API calls/month (first 12 months)
- **S3**: 5GB storage, 20,000 GET requests/month
- **CloudFront**: 1TB data transfer, 10M requests/month

After Free Tier limits, costs are minimal for low usage (~$0.50/month for typical usage).

## Documentation

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Complete development and deployment guide
- **[.env.example](.env.example)** - Environment variable reference

## Troubleshooting

### Common Issues

**"Unable to resolve AWS account"**
- Run `aws configure` to set up your AWS credentials

**"Port 3001 already in use"**
- Use a different port: `CT_PORT=3002 npm run backend`
- Or kill the process using port 3001

**"Missing required environment variables"**
- Ensure you've set `CT_MEMBERSTACK_PUBLIC_KEY` and `CT_MEMBERSTACK_SECRET_KEY` in your environment

See [DEVELOPMENT.md](DEVELOPMENT.md) for more troubleshooting help.

## Cleanup

Remove AWS resources to avoid charges:

```bash
npm run destroy:test   # Remove test environment
npm run destroy:prod   # Remove production environment
```

## License

ISC
