# Cardmaker

A greeting card creation platform with AI image generation. Currently in planning phase for v0.1 POC.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run locally
npm run local
```

Opens at http://localhost:8080

## Documentation

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Setup, deployment, testing, and troubleshooting
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Infrastructure diagrams and system design
- **[.env.example](.env.example)** - Environment variable reference

## Key Features

- Serverless AWS infrastructure (Lambda, API Gateway, CloudFront, S3)
- HTTPS with global CDN
- Multi-environment support (local, test, production)
- Rate limiting and security built-in

## License

ISC
