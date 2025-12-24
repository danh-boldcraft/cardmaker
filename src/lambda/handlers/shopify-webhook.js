/**
 * Shopify Webhook Handler
 * Receives orders/paid webhooks and triggers fulfillment
 */

const { verifyShopifyHmac } = require('../utils/shopify-hmac');
const { submitOrder } = require('../services/printify-service');

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

/**
 * Extract card image data from line item properties
 * Properties prefixed with _ are hidden from customer checkout UI
 */
function extractCardImageFromLineItem(lineItem) {
  if (!lineItem.properties || !Array.isArray(lineItem.properties)) {
    return null;
  }

  const imageUrlProp = lineItem.properties.find(
    p => p.name === '_Card Image URL' || p.name === 'Card Image URL'
  );
  const imageIdProp = lineItem.properties.find(
    p => p.name === '_Card Image ID' || p.name === 'Card Image ID'
  );

  if (!imageUrlProp) {
    return null;
  }

  return {
    imageUrl: imageUrlProp.value,
    imageId: imageIdProp ? imageIdProp.value : null,
    lineItemId: lineItem.id,
    quantity: lineItem.quantity
  };
}

/**
 * Handle Shopify orders/paid webhook
 */
async function handleShopifyWebhook(event) {
  // Check for webhook secret configuration
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('SHOPIFY_WEBHOOK_SECRET environment variable not configured');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  // Get HMAC header
  const hmacHeader = event.headers['x-shopify-hmac-sha256']
    || event.headers['X-Shopify-Hmac-Sha256'];

  if (!hmacHeader) {
    console.warn('Webhook received without HMAC header');
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Missing webhook signature' })
    };
  }

  // Verify HMAC signature using raw body
  const rawBody = event.body;
  const isValid = verifyShopifyHmac(rawBody, hmacHeader, webhookSecret);

  if (!isValid) {
    console.warn('Invalid webhook signature');
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid webhook signature' })
    };
  }

  // Parse the webhook payload
  let order;
  try {
    order = JSON.parse(rawBody);
  } catch (error) {
    console.error('Failed to parse webhook payload:', error);
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid JSON payload' })
    };
  }

  // Log order receipt
  console.log('Received orders/paid webhook:', {
    orderId: order.id,
    orderNumber: order.order_number,
    email: order.email,
    lineItemCount: order.line_items?.length || 0
  });

  // Extract card images from line items
  const cardItems = [];
  if (order.line_items && Array.isArray(order.line_items)) {
    for (const lineItem of order.line_items) {
      const cardImage = extractCardImageFromLineItem(lineItem);
      if (cardImage) {
        cardItems.push(cardImage);
      }
    }
  }

  if (cardItems.length === 0) {
    console.log('No card images found in order line items');
    // Still return 200 - this might be a non-card order
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        received: true,
        orderId: order.id,
        message: 'No card items to fulfill'
      })
    };
  }

  console.log('Found card items to fulfill:', {
    orderId: order.id,
    cardCount: cardItems.length,
    cards: cardItems.map(c => ({ imageId: c.imageId, quantity: c.quantity }))
  });

  // Extract shipping address
  const shippingAddress = order.shipping_address ? {
    firstName: order.shipping_address.first_name,
    lastName: order.shipping_address.last_name,
    address1: order.shipping_address.address1,
    address2: order.shipping_address.address2 || '',
    city: order.shipping_address.city,
    provinceCode: order.shipping_address.province_code,
    countryCode: order.shipping_address.country_code,
    zip: order.shipping_address.zip
  } : null;

  if (!shippingAddress) {
    console.error('Order missing shipping address:', order.id);
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Order missing shipping address' })
    };
  }

  // Submit order to Printify for fulfillment
  console.log('Submitting order to Printify:', {
    orderId: order.id,
    email: order.email,
    cardCount: cardItems.length
  });

  const printifyResult = await submitOrder({
    shopifyOrderId: order.id,
    email: order.email,
    cardItems: cardItems,
    shippingAddress: shippingAddress
  });

  if (printifyResult.success) {
    console.log('Printify order submitted successfully:', {
      shopifyOrderId: order.id,
      printifyOrderId: printifyResult.printifyOrderId,
      status: printifyResult.status
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        received: true,
        orderId: order.id,
        cardsToFulfill: cardItems.length,
        printifyOrderId: printifyResult.printifyOrderId,
        printifyStatus: printifyResult.status
      })
    };
  } else {
    // Log the error but still return 200 to Shopify
    // Returning non-200 would cause Shopify to retry, which won't help
    console.error('Printify order submission failed:', {
      shopifyOrderId: order.id,
      error: printifyResult.error,
      details: printifyResult.details
    });

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        received: true,
        orderId: order.id,
        cardsToFulfill: cardItems.length,
        printifyError: printifyResult.error,
        message: 'Order received but Printify submission failed - requires manual intervention'
      })
    };
  }
}

module.exports = { handleShopifyWebhook };
