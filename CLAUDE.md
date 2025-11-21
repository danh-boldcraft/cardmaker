# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Local File System Search Guidelines

### Required Search Behavior
<search-behavior>
  <rule>ALWAYS use ripgrep (rg) for text searches - faster and respects .gitignore</rule>
  <rule>ALWAYS use fd for file finding - faster and respects .gitignore</rule>
</search-behavior>
rg and fd are faster and respect .gitignore automatically.

## Memberstack Integration

Always reference the official Memberstack documentation:
- DomPackage: https://developers.memberstack.com/dom-package/
- Admin Node.js package: https://developers.memberstack.com/admin-node-package
- Admin REST API: https://developers.memberstack.com/admin-rest-api

When implementing Memberstack features, fetch the relevant section above.

## Environment Configuration
- Prefer configuration via environment variables (env vars) vs AWS secrets manager
- For env vars that must, or can, be set by a developer should be referenced in .env.example as follows:
- Required env vars must exist with placeholder values.
- Optional env vars must have commented-out examples
- All env vars must have comments documenting them.
- Env vars should start with "CT_" so they are grouped together alphabetically
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