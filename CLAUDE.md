# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Local File System Search Guidelines

### Required Search Behavior
- Always Use ripgrep (rg) for text searches
- Always Use fd for file finding
These tools are faster and respect .gitignore automatically.

## Project Configuration
### Memberstack Integration

Always reference the official Memberstack documentation:
https://developers.memberstack.com/

Specific sections:
- DomPackage: https://developers.memberstack.com/dom-package/
- Admin Node.js package: https://developers.memberstack.com/admin-node-package
- Admin REST API: https://developers.memberstack.com/admin-rest-api

When implementing Memberstack features, fetch the relevant section above.


## Architecture Summary

### Tech Stack
- **Infrastructure**: AWS CDK (JavaScript)
- **Backend**: Node.js 20.x Lambda function
- **Frontend**: Static HTML/CSS/JavaScript (no build step)
- **Hosting**: S3 + CloudFront (HTTPS)
- **API**: REST API via API Gateway

### AWS Services
- Lambda (compute)
- API Gateway (REST API with CORS & throttling)
- S3 (private bucket for static files)
- CloudFront (CDN with HTTPS enforcement)

### Project Structure
```
bin/app.js                 # CDK app entry point
lib/multiply-stack.js      # CDK infrastructure definition
src/lambda/handler.js      # Lambda function (multiply by 3)
public/                    # Static frontend files
  ├── index.html           # Main app
  ├── app.js               # Frontend logic
  ├── config.js            # Environment detection & API endpoints
  └── breakout/            # Breakout game
config/                    # Environment configs (local, test, prod)
local-server.js            # Local backend simulator
```

### Key Commands
```bash
npm run local              # Run frontend + backend locally
npm run deploy:test        # Deploy to test environment
npm run deploy:prod        # Deploy to production
npm test                   # Run Lambda unit tests
```

### Environment Configuration
- Prefer configuration via environment variables vs AWS secrets manager
- Add checks for required environment variables in code to early-out if possible and log the error if possible.
- All environment variables should start with "CT_" so they show up together when listed
- Configs stored in `config/{env}.json`
- `DEPLOY_ENV` env var selects environment (default: test)
- Frontend auto-detects environment by hostname

### API
- Endpoint: POST `/multiply`
- Request: `{"number": 5}`
- Response: `{"input": 5, "result": 15}`
- Rate limited: 10 req/sec per method

### Important Files to Update After Deployment
- `public/config.js` - Add new API endpoints and CloudFront domains