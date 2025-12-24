/**
 * Shopify HMAC Verification Utility
 * Verifies webhook signatures to prevent spoofed requests
 */

const crypto = require('crypto');

/**
 * Verify Shopify webhook HMAC signature
 * @param {string} rawBody - Raw request body (not parsed JSON)
 * @param {string} hmacHeader - Value of X-Shopify-Hmac-Sha256 header
 * @param {string} secret - Webhook signing secret from Shopify
 * @returns {boolean} True if signature is valid
 */
function verifyShopifyHmac(rawBody, hmacHeader, secret) {
  if (!rawBody || !hmacHeader || !secret) {
    return false;
  }

  try {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(hmacHeader)
    );
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

module.exports = { verifyShopifyHmac };
