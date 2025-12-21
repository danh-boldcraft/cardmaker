const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

/**
 * Service for generating images using AWS Bedrock Titan Image Generator
 */
class BedrockImageService {
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.BEDROCK_REGION || 'us-west-2'
    });
    this.modelId = process.env.BEDROCK_IMAGE_MODEL || 'amazon.titan-image-generator-v2:0';
    this.width = parseInt(process.env.BEDROCK_IMAGE_WIDTH, 10) || 1500;
    this.height = parseInt(process.env.BEDROCK_IMAGE_HEIGHT, 10) || 2100;
    this.quality = process.env.BEDROCK_IMAGE_QUALITY || 'premium';
  }

  /**
   * Generate an image from a text prompt
   * @param {string} prompt - The text description for the image
   * @returns {Promise<{imageData: string, contentType: string}>} Base64-encoded image data
   */
  async generateImage(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required and must be a string');
    }

    const sanitizedPrompt = prompt.trim().substring(0, 512);
    if (sanitizedPrompt.length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    const requestBody = {
      taskType: 'TEXT_IMAGE',
      textToImageParams: {
        text: sanitizedPrompt
      },
      imageGenerationConfig: {
        numberOfImages: 1,
        width: this.width,
        height: this.height,
        quality: this.quality,
        cfgScale: 8.0,
        seed: Math.floor(Math.random() * 2147483647)
      }
    };

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    });

    try {
      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      if (!responseBody.images || responseBody.images.length === 0) {
        throw new Error('No image generated');
      }

      return {
        imageData: responseBody.images[0],
        contentType: 'image/png'
      };
    } catch (error) {
      if (error.name === 'ValidationException') {
        throw new Error(`Invalid prompt: ${error.message}`);
      }
      if (error.name === 'ThrottlingException') {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (error.name === 'AccessDeniedException') {
        throw new Error('Access denied to Bedrock model. Check IAM permissions.');
      }
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }
}

module.exports = { BedrockImageService };
