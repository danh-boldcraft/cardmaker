const { BedrockImageService } = require('../services/bedrock-image-service');
const { S3ImageService } = require('../services/s3-image-service');
const { UsageTrackerService } = require('../services/usage-tracker-service');

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

/**
 * Handle POST /generate-card request
 * Generates an AI greeting card image and returns a presigned URL
 */
async function handleGenerateCard(event) {
  const debugMode = process.env.DEBUG_MODE === 'true';

  try {
    // Parse and validate request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    // Validate prompt field
    if (!body.prompt) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing required field: prompt' })
      };
    }

    if (typeof body.prompt !== 'string') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Prompt must be a string' })
      };
    }

    const prompt = body.prompt.trim();
    if (prompt.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Prompt cannot be empty' })
      };
    }

    if (prompt.length > 512) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Prompt exceeds maximum length of 512 characters' })
      };
    }

    // Check daily usage limit
    const usageTracker = new UsageTrackerService();
    const usageCheck = await usageTracker.checkAndIncrement();

    if (!usageCheck.allowed) {
      return {
        statusCode: 429,
        headers: corsHeaders,
        body: JSON.stringify({
          error: `Daily generation limit reached (${usageCheck.limit}/day). Try again tomorrow.`,
          currentCount: usageCheck.currentCount,
          limit: usageCheck.limit
        })
      };
    }

    if (debugMode) {
      console.log(`Usage: ${usageCheck.currentCount}/${usageCheck.limit} generations today`);
    }

    // Generate image using Bedrock
    if (debugMode) {
      console.log(`Generating image for prompt: "${prompt.substring(0, 50)}..."`);
    }

    const bedrockService = new BedrockImageService();
    const { imageData, contentType } = await bedrockService.generateImage(prompt);

    if (debugMode) {
      console.log('Image generated successfully, uploading to S3...');
    }

    // Upload to S3 and get presigned URL
    const s3Service = new S3ImageService();
    const { imageId, imageUrl, expiresAt } = await s3Service.uploadAndGetUrl(imageData, contentType);

    if (debugMode) {
      console.log(`Image uploaded: ${imageId}, URL expires at ${expiresAt}`);
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        imageId,
        imageUrl,
        expiresAt
      })
    };

  } catch (error) {
    console.error('Error in generate-card:', error);

    // Check for known error types
    if (error.message.includes('Rate limit')) {
      return {
        statusCode: 429,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }

    if (error.message.includes('Access denied')) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Service configuration error. Please contact support.' })
      };
    }

    if (error.message.includes('Invalid prompt')) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Image generation failed. Please try again.',
        details: debugMode ? error.message : undefined
      })
    };
  }
}

module.exports = { handleGenerateCard };
