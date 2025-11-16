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
  test: 'https://irvyesnnzj.execute-api.us-west-2.amazonaws.com/prod/multiply',  // Test environment
  prod: 'https://usyl5zha62.execute-api.us-west-2.amazonaws.com/prod/multiply'  // Production environment
};

// CloudFront domain mappings (to detect environment)
const CLOUDFRONT_DOMAINS = {
  test: 'du85n5akt8cz3.cloudfront.net',  // Test environment CloudFront
  prod: 'd2ohaeiivgnrqq.cloudfront.net'  // Production environment CloudFront
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

// Global API configuration
const API_CONFIG = {
  environment: detectEnvironment(),
  endpoint: getApiEndpoint(),
  debug: detectEnvironment() !== 'prod'  // Debug mode for local and test
};

// Log current configuration (non-production only)
if (API_CONFIG.debug) {
  console.log('🔧 API Configuration:');
  console.log('   Environment:', API_CONFIG.environment.toUpperCase());
  console.log('   Endpoint:', API_CONFIG.endpoint);
  console.log('   Debug mode: ON');
  if (API_CONFIG.environment === 'local') {
    console.log('   💡 Tip: Make sure local backend is running (npm run backend)');
  }
}
