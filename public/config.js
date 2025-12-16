// API Configuration
// Supports local, test, and production environments

/**
 * Environment detection and API endpoint configuration
 *
 * Environments:
 * - Local:  localhost:8080 → http://localhost:3001/multiply
 * - Test:   CloudFront (test) → Test API Gateway
 * - Prod:   CloudFront (prod) → Production API Gateway
 *
 * After deploying test/prod, update the endpoints below with your CloudFront URLs
 */

// Environment-specific API endpoints
const API_ENDPOINTS = {
  local: 'http://localhost:3001/multiply',
  test: 'REPLACE_WITH_TEST_API_ENDPOINT',  // Test environment - update after deployment
  prod: 'REPLACE_WITH_PROD_API_ENDPOINT'   // Production environment - update after deployment
};

// Environment-specific Memberstack public keys
// Test mode keys (pk_sb_*) access test members only
// Live mode keys (pk_*) access live/production members only
//
// LOCAL DEVELOPMENT: Temporarily paste your test public key (CM_MEMBERSTACK_LOCAL_PUBLIC_KEY
// from .env) on the 'local:' line below when running locally. Don't commit this change!
//
// TEST/PROD: Keys are automatically injected during deployment
const MEMBERSTACK_PUBLIC_KEYS = {
  local: 'MEMBERSTACK_PUBLIC_KEY_PLACEHOLDER',   // Paste your pk_sb_* key here for local dev nocheckin
  test: 'MEMBERSTACK_PUBLIC_KEY_PLACEHOLDER',    // Injected during deployment
  prod: 'MEMBERSTACK_PUBLIC_KEY_PLACEHOLDER'     // Injected during deployment
};

// CloudFront domain mappings (to detect environment)
const CLOUDFRONT_DOMAINS = {
  test: 'REPLACE_WITH_TEST_CLOUDFRONT_DOMAIN',  // Test environment CloudFront - update after deployment
  prod: 'REPLACE_WITH_PROD_CLOUDFRONT_DOMAIN'   // Production environment CloudFront - update after deployment
};

/**
 * Detect current environment based on hostname
 */
function detectEnvironment() {
  const hostname = window.location.hostname;
  const port = window.location.port;

  // Local development (localhost:8080)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'local';
  }

  // Test environment (CloudFront test domain)
  if (hostname === CLOUDFRONT_DOMAINS.test ||
      hostname.includes(CLOUDFRONT_DOMAINS.test)) {
    return 'test';
  }

  // Production environment (CloudFront prod domain)
  if (hostname === CLOUDFRONT_DOMAINS.prod ||
      hostname.includes(CLOUDFRONT_DOMAINS.prod)) {
    return 'prod';
  }

  // Default to production for any other CloudFront domains
  if (hostname.includes('cloudfront.net')) {
    return 'prod';
  }

  // Default fallback
  return 'prod';
}

/**
 * Get API endpoint for current environment
 */
function getApiEndpoint() {
  const env = detectEnvironment();
  const endpoint = API_ENDPOINTS[env];

  // Validate endpoint is configured
  if (endpoint.includes('REPLACE_WITH')) {
    console.warn(`⚠️ ${env.toUpperCase()} API endpoint not configured yet!`);
    console.warn(`   Update API_ENDPOINTS.${env} in config.js after deployment.`);
  }

  return endpoint;
}

/**
 * Get Memberstack public key for current environment
 */
function getMemberstackPublicKey() {
  const env = detectEnvironment();
  const publicKey = MEMBERSTACK_PUBLIC_KEYS[env];

  // Validate key is configured
  if (publicKey.includes('PLACEHOLDER')) {
    if (env === 'local') {
      console.warn(`⚠️ Memberstack public key not set for local development.`);
      console.warn(`   Temporarily paste your CM_MEMBERSTACK_LOCAL_PUBLIC_KEY on the 'local:' line in config.js`);
    } else {
      console.warn(`⚠️ ${env.toUpperCase()} Memberstack public key not configured yet!`);
      console.warn(`   This should be injected automatically during deployment.`);
    }
  }

  return publicKey;
}

// Global API configuration
const API_CONFIG = {
  environment: detectEnvironment(),
  endpoint: getApiEndpoint(),
  memberstackPublicKey: getMemberstackPublicKey(),
  debug: detectEnvironment() !== 'prod'  // Debug mode for local and test
};

// Log current configuration (non-production only)
if (API_CONFIG.debug) {
  console.log('🔧 API Configuration:');
  console.log('   Environment:', API_CONFIG.environment.toUpperCase());
  console.log('   Endpoint:', API_CONFIG.endpoint);
  console.log('   Memberstack Key:', API_CONFIG.memberstackPublicKey.substring(0, 10) + '...');
  console.log('   Debug mode: ON');
  if (API_CONFIG.environment === 'local') {
    console.log('   💡 Tip: Make sure local backend is running (npm run backend)');
  }
}
