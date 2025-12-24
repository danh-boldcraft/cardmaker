/**
 * Printify Service
 * Submits orders to Printify API for print-on-demand fulfillment
 */

const https = require('https');

/**
 * Make an HTTPS request to Printify API
 */
function printifyRequest(method, path, body = null) {
  const apiKey = process.env.PRINTIFY_API_KEY;

  if (!apiKey) {
    throw new Error('PRINTIFY_API_KEY environment variable not configured');
  }

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.printify.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Submit an order to Printify for fulfillment
 *
 * @param {Object} params Order parameters
 * @param {string} params.shopifyOrderId - Shopify order ID for reference
 * @param {string} params.email - Customer email
 * @param {Array} params.cardItems - Array of card items with imageUrl, imageId, quantity
 * @param {Object} params.shippingAddress - Shipping address
 * @returns {Object} Printify order response
 */
async function submitOrder({ shopifyOrderId, email, cardItems, shippingAddress }) {
  const shopId = process.env.PRINTIFY_SHOP_ID;
  const blueprintId = process.env.PRINTIFY_CARD_BLUEPRINT_ID || '1094';
  const printProviderId = process.env.PRINTIFY_PRINT_PROVIDER_ID || '228';
  const variantId = process.env.PRINTIFY_CARD_VARIANT_ID || '81866'; // 5x7 Vertical Matte 1pc

  if (!shopId) {
    throw new Error('PRINTIFY_SHOP_ID environment variable not configured');
  }

  // Build line items from card items
  const lineItems = cardItems.map(card => ({
    print_provider_id: parseInt(printProviderId, 10),
    blueprint_id: parseInt(blueprintId, 10),
    variant_id: parseInt(variantId, 10),
    print_areas: {
      front: card.imageUrl
    },
    quantity: card.quantity || 1
  }));

  // Build the order payload
  const orderPayload = {
    external_id: `shopify-${shopifyOrderId}`,
    label: `AI Greeting Card - Order ${shopifyOrderId}`,
    line_items: lineItems,
    shipping_method: 1, // Standard shipping
    send_shipping_notification: true,
    address_to: {
      first_name: shippingAddress.firstName,
      last_name: shippingAddress.lastName,
      email: email,
      phone: shippingAddress.phone || '',
      country: shippingAddress.countryCode || 'US',
      region: shippingAddress.provinceCode || '',
      address1: shippingAddress.address1,
      address2: shippingAddress.address2 || '',
      city: shippingAddress.city,
      zip: shippingAddress.zip
    }
  };

  console.log('Submitting order to Printify:', {
    shopId,
    externalId: orderPayload.external_id,
    lineItemCount: lineItems.length,
    shippingTo: `${shippingAddress.city}, ${shippingAddress.provinceCode}`
  });

  try {
    const response = await printifyRequest(
      'POST',
      `/v1/shops/${shopId}/orders.json`,
      orderPayload
    );

    if (response.status >= 200 && response.status < 300) {
      console.log('Printify order created successfully:', {
        printifyOrderId: response.data.id,
        status: response.data.status
      });

      return {
        success: true,
        printifyOrderId: response.data.id,
        status: response.data.status,
        externalId: orderPayload.external_id
      };
    } else {
      console.error('Printify API error:', {
        status: response.status,
        error: response.data
      });

      return {
        success: false,
        error: response.data.error || response.data.message || 'Unknown Printify error',
        details: response.data.errors || null
      };
    }
  } catch (error) {
    console.error('Printify request failed:', error);

    return {
      success: false,
      error: error.message || 'Failed to connect to Printify API'
    };
  }
}

/**
 * Check if an order already exists in Printify (idempotency check)
 *
 * @param {string} externalId - External order ID to check
 * @returns {Object|null} Existing order if found, null otherwise
 */
async function findOrderByExternalId(externalId) {
  const shopId = process.env.PRINTIFY_SHOP_ID;

  if (!shopId) {
    throw new Error('PRINTIFY_SHOP_ID environment variable not configured');
  }

  try {
    // Note: Printify doesn't have a direct lookup by external_id
    // We would need to list orders and filter, which is expensive
    // For now, we'll rely on Printify rejecting duplicates
    // Future enhancement: Store order mappings in DynamoDB
    return null;
  } catch (error) {
    console.error('Error checking for existing order:', error);
    return null;
  }
}

module.exports = {
  submitOrder,
  findOrderByExternalId
};
