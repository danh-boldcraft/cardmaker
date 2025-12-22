/**
 * Checkout Handler
 * Creates Shopify Draft Orders for AI-generated greeting cards
 */

const { createDraftOrder } = require('../services/shopify-service');
const { UsageTrackerService } = require('../services/usage-tracker-service');

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate shipping address
 */
function validateShippingAddress(address) {
  const requiredFields = ['firstName', 'lastName', 'address1', 'city', 'state', 'zip', 'country'];
  const missingFields = requiredFields.filter(field => !address || !address[field]);

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required shipping address fields: ${missingFields.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Handle checkout endpoint
 */
async function handleCheckout(event) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.imageId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required field: imageId' })
      };
    }

    if (!body.email) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required field: email' })
      };
    }

    if (!isValidEmail(body.email)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid email format' })
      };
    }

    if (!body.shippingAddress) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required field: shippingAddress' })
      };
    }

    // Validate shipping address
    const addressValidation = validateShippingAddress(body.shippingAddress);
    if (!addressValidation.valid) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: addressValidation.error })
      };
    }

    // Check daily order limit
    const usageTracker = new UsageTrackerService();
    const limitCheck = await usageTracker.checkOrderLimit();

    if (!limitCheck.allowed) {
      return {
        statusCode: 429,
        headers: corsHeaders,
        body: JSON.stringify({
          error: `Daily order limit reached (${limitCheck.limit}/day). Try again tomorrow.`,
          currentCount: limitCheck.currentCount,
          limit: limitCheck.limit
        })
      };
    }

    // Get image URL - in a real implementation, we'd retrieve this from S3 or database
    // For now, we expect the frontend to pass it, or we construct it from imageId
    // We'll need the actual S3 presigned URL for Printify to download later
    const imageUrl = body.imageUrl || `https://${process.env.IMAGE_BUCKET_NAME}.s3.${process.env.BEDROCK_REGION || 'us-west-2'}.amazonaws.com/cards/${body.imageId}.png`;

    // Create Shopify Draft Order
    const draftOrder = await createDraftOrder({
      imageId: body.imageId,
      imageUrl: imageUrl,
      email: body.email,
      shippingAddress: body.shippingAddress
    });

    // Increment order counter on success
    await usageTracker.incrementOrderCounter();

    // Return success response with checkout URL
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        orderId: draftOrder.orderId,
        checkoutUrl: draftOrder.checkoutUrl
      })
    };

  } catch (error) {
    console.error('Checkout error:', error);

    // Handle specific error types
    if (error.message.includes('Shopify')) {
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({
          error: `Failed to create order: ${error.message}`
        })
      };
    }

    if (error.message.includes('environment variable')) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Server configuration error. Please contact support.'
        })
      };
    }

    // Generic error
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to process checkout. Please try again.'
      })
    };
  }
}

module.exports = { handleCheckout };
