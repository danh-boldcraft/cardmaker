# Cardmaker

An art creation platform with AI image generation APIs, featuring a web frontend and backend API deployed on AWS.

## Features

- ✅ **Secure HTTPS** - SSL/TLS encryption via CloudFront
- ✅ **Global CDN** - Fast loading worldwide
- ✅ **Rate Limiting** - API throttling (10 req/sec) to prevent abuse
- ✅ **Serverless** - Auto-scaling, pay-per-use AWS Lambda
- ✅ **Modern UI** - Clean, responsive web interface
- ✅ **Multi-Environment** - Separate local, test, and production deployments

## Architecture

- **Frontend**: Static website (S3 + CloudFront with HTTPS)
- **Backend**: AWS Lambda (Node.js 20.x) + API Gateway
- **Infrastructure**: AWS CDK for repeatable deployments
- **Rate Limiting**: Built-in API Gateway throttling

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env
# Edit .env with your API keys

# Run locally
npm run local
```

Opens frontend at http://localhost:8080 and backend at http://localhost:3001.

**For complete setup, deployment, and development instructions, see [DEVELOPMENT.md](DEVELOPMENT.md).**

## Testing

```bash
# Run backend unit tests
npm test

# Run frontend E2E tests (requires local server)
npm run dev              # Start server in one terminal
npm run test:frontend    # Run tests in another terminal
```

**For detailed testing instructions, see [DEVELOPMENT.md](DEVELOPMENT.md).**

## API Usage

**Endpoint:** `POST /multiply`

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

**Example:**
```bash
curl -X POST YOUR_API_ENDPOINT/multiply \
  -H "Content-Type: application/json" \
  -d '{"number": 5}'
```

## Documentation

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Complete development, deployment, and troubleshooting guide
- **[.env.example](.env.example)** - Environment variable reference

## License

ISC
