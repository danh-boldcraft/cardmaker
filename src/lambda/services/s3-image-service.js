const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

/**
 * Service for storing images in S3 and generating presigned URLs
 */
class S3ImageService {
  constructor() {
    this.client = new S3Client({
      region: process.env.BEDROCK_REGION || 'us-west-2'
    });
    this.bucketName = process.env.IMAGE_BUCKET_NAME;
    this.presignedUrlExpiry = 4 * 60 * 60; // 4 hours in seconds

    if (!this.bucketName) {
      throw new Error('IMAGE_BUCKET_NAME environment variable is required');
    }
  }

  /**
   * Generate a unique image ID
   * @returns {string} UUID v4
   */
  generateImageId() {
    return crypto.randomUUID();
  }

  /**
   * Upload an image to S3
   * @param {string} imageId - Unique identifier for the image
   * @param {string} base64Data - Base64-encoded image data
   * @param {string} contentType - MIME type of the image
   * @returns {Promise<{key: string}>} S3 object key
   */
  async uploadImage(imageId, base64Data, contentType = 'image/png') {
    const key = `cards/${imageId}.png`;
    const buffer = Buffer.from(base64Data, 'base64');

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        'generated-at': new Date().toISOString()
      }
    });

    try {
      await this.client.send(command);
      return { key };
    } catch (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Generate a presigned URL for reading an image
   * @param {string} imageId - Unique identifier for the image
   * @returns {Promise<{imageUrl: string, expiresAt: string}>} Presigned URL and expiration timestamp
   */
  async getPresignedUrl(imageId) {
    const key = `cards/${imageId}.png`;

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    try {
      const imageUrl = await getSignedUrl(this.client, command, {
        expiresIn: this.presignedUrlExpiry
      });

      const expiresAt = new Date(Date.now() + this.presignedUrlExpiry * 1000).toISOString();

      return { imageUrl, expiresAt };
    } catch (error) {
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  /**
   * Upload image and get presigned URL in one operation
   * @param {string} base64Data - Base64-encoded image data
   * @param {string} contentType - MIME type of the image
   * @returns {Promise<{imageId: string, imageUrl: string, expiresAt: string}>}
   */
  async uploadAndGetUrl(base64Data, contentType = 'image/png') {
    const imageId = this.generateImageId();

    await this.uploadImage(imageId, base64Data, contentType);
    const { imageUrl, expiresAt } = await this.getPresignedUrl(imageId);

    return { imageId, imageUrl, expiresAt };
  }
}

module.exports = { S3ImageService };
