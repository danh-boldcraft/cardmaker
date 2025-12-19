# CLAUDE.md

This file provides guidance to Claude Code when working with the Cardmaker project.

## Local File System Search Guidelines

### Required Search Behavior
<search-behavior>
  <rule>ALWAYS use ripgrep (rg) for text searches - faster and respects .gitignore</rule>
  <rule>ALWAYS use fd for file finding - faster and respects .gitignore</rule>
</search-behavior>
rg and fd are faster and respect .gitignore automatically.

## Documentation
### Printify (Backend Fulfillment)
- Printify API Reference: https://developers.printify.com/api/reference
- Printify Help Center: https://help.printify.com/hc/en-us

### Shopify (Product Data & Checkout)
- Admin API (coding): https://shopify.dev/docs/api/admin
- Storefront API (coding): https://shopify.dev/docs/api/storefront
- Help Center (UI walkthrough): https://help.shopify.com/en

### Local Documentation Files

#### Memberstack (Currently Implemented)
Memberstack authentication is implemented in the current codebase. Local documentation is available:
- DomPackage: `./docs/memberstack/memberstack--dom-package/`
- Admin Node.js package: `./docs/memberstack/memberstack--admin-node-package/`
- Admin REST API: `./docs/memberstack/memberstack--admin-rest-api/`

Before searching the web for Memberstack information, always check local docs first.

**Note**: The v0.1 POC (cardmaker features) uses WAF IP allowlist for access control and does not require Memberstack. Memberstack integration remains in the codebase for potential future features.

## How to Use Local Docs
1. First check the local documentation files in the `docs/` directory
2. Only search the web if information is not found locally
3. The local documentation is authoritative for this project


## Environment Configuration
- Prefer configuration via environment variables (env vars) vs AWS secrets manager
- For env vars that must, or can, be set by a developer should be referenced in .env.example as follows:
- Required env vars must exist with placeholder values.
- Optional env vars must have commented-out examples
- All env vars must have comments documenting them.
- Env vars should start with "CM_" so they are grouped together alphabetically
- For all required env vars, add checks in code (where possible) to early-out and log the error.

## File Contents
- Outside of this CLAUDE.md file, limit project documentation to a high-level README.md and DEVELOPMENT.md which includes details. They shouldn't be redundant.

## Tests
- Put oneoff tests in a /tests folder and prefix them with the component they're testing so if it's the lambda prefix with lambda

## Other
- Configs stored in `config/{env}.json`
- `DEPLOY_ENV` env var selects environment (default: test)
- Frontend auto-detects environment by hostname

## Important Files to Update After Deployment
- `public/config.js` - Add new API endpoints and CloudFront domains