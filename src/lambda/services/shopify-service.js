/**
 * Shopify Draft Order Service
 *
 * Creates draft orders via Shopify Admin API for AI-generated greeting cards.
 * Draft orders allow customers to complete checkout through Shopify's trusted payment flow.
 */

const https = require('https');

/**
 * Creates a Draft Order in Shopify with card image metadata
 *
 * @param {Object} params - Order parameters
 * @param {string} params.imageId - UUID of the generated card image
 * @param {string} params.imageUrl - S3 presigned URL of the card image
 * @param {string} params.email - Customer email address
 * @param {Object} params.shippingAddress - Shipping address details
 * @param {string} params.shippingAddress.firstName - Customer first name
 * @param {string} params.shippingAddress.lastName - Customer last name
 * @param {string} params.shippingAddress.address1 - Street address
 * @param {string} params.shippingAddress.address2 - Apt/Suite (optional)
 * @param {string} params.shippingAddress.city - City
 * @param {string} params.shippingAddress.state - State/Province code
 * @param {string} params.shippingAddress.zip - ZIP/Postal code
 * @param {string} params.shippingAddress.country - Country code (US, CA, etc.)
 * @returns {Promise<Object>} Draft order with orderId and checkoutUrl
 */
async function createDraftOrder({ imageId, imageUrl, email, shippingAddress }) {
  // Validate required environment variables
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const variantIdRaw = process.env.SHOPIFY_CARD_VARIANT_ID;

  if (!storeDomain) {
    throw new Error('SHOPIFY_STORE_DOMAIN environment variable not configured');
  }
  if (!accessToken) {
    throw new Error('SHOPIFY_ACCESS_TOKEN environment variable not configured');
  }
  if (!variantIdRaw) {
    throw new Error('SHOPIFY_CARD_VARIANT_ID environment variable not configured');
  }

  // Extract numeric variant ID from GID format if needed
  // Format: gid://shopify/ProductVariant/1234567890 or just 1234567890
  let variantId = variantIdRaw;
  if (variantIdRaw.includes('gid://shopify/ProductVariant/')) {
    variantId = variantIdRaw.split('/').pop();
  } else if (variantIdRaw.includes('/')) {
    // Handle any other GID format
    variantId = variantIdRaw.split('/').pop();
  }

  // Build the draft order payload
  const draftOrderData = {
    draft_order: {
      email: email,
      line_items: [
        {
          variant_id: variantId,
          quantity: 1,
          properties: [
            { name: '_card_image_url', value: imageUrl },
            { name: '_card_image_id', value: imageId }
          ]
        }
      ],
      shipping_address: {
        first_name: shippingAddress.firstName,
        last_name: shippingAddress.lastName,
        address1: shippingAddress.address1,
        address2: shippingAddress.address2 || '',
        city: shippingAddress.city,
        province: shippingAddress.state,
        country: shippingAddress.country,
        zip: shippingAddress.zip
      },
      use_customer_default_address: false
    }
  };

  const payload = JSON.stringify(draftOrderData);

  // Make API request to Shopify
  return new Promise((resolve, reject) => {
    const options = {
      hostname: storeDomain,
      port: 443,
      path: '/admin/api/2024-01/draft_orders.json',
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (res.statusCode >= 200 && res.statusCode < 300) {
            // Success - extract draft order details
            const draftOrder = response.draft_order;

            resolve({
              orderId: draftOrder.id.toString(),
              checkoutUrl: draftOrder.invoice_url
            });
          } else {
            // Shopify API error
            console.error('Shopify API error:', {
              statusCode: res.statusCode,
              response: response
            });

            const errorMessage = response.errors
              ? JSON.stringify(response.errors)
              : 'Unknown Shopify API error';

            reject(new Error(`Shopify API error (${res.statusCode}): ${errorMessage}`));
          }
        } catch (parseError) {
          console.error('Failed to parse Shopify response:', parseError);
          reject(new Error('Failed to parse Shopify API response'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('HTTPS request error:', error);
      reject(new Error(`Failed to connect to Shopify: ${error.message}`));
    });

    req.write(payload);
    req.end();
  });
}

module.exports = {
  createDraftOrder
};
