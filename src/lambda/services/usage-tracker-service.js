const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

/**
 * Service for tracking daily usage limits using DynamoDB
 */
class UsageTrackerService {
  constructor() {
    const client = new DynamoDBClient({
      region: process.env.BEDROCK_REGION || 'us-west-2'
    });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = process.env.USAGE_TABLE_NAME;
    this.maxDailyGenerations = parseInt(process.env.MAX_DAILY_GENERATIONS, 10) || 50;

    if (!this.tableName) {
      throw new Error('USAGE_TABLE_NAME environment variable is required');
    }
  }

  /**
   * Get today's date key in YYYY-MM-DD format
   * @returns {string} Date key
   */
  getDateKey() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get TTL timestamp for 7 days from now (for auto-cleanup)
   * @returns {number} Unix timestamp
   */
  getTtl() {
    return Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
  }

  /**
   * Check if more generations are allowed today
   * @returns {Promise<{allowed: boolean, currentCount: number, limit: number}>}
   */
  async checkLimit() {
    const dateKey = this.getDateKey();

    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { dateKey }
      });

      const response = await this.docClient.send(command);
      const currentCount = response.Item?.generationCount || 0;

      return {
        allowed: currentCount < this.maxDailyGenerations,
        currentCount,
        limit: this.maxDailyGenerations
      };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      // On error, allow the request but log it
      return {
        allowed: true,
        currentCount: 0,
        limit: this.maxDailyGenerations,
        error: error.message
      };
    }
  }

  /**
   * Increment the generation counter for today
   * @returns {Promise<{newCount: number}>}
   */
  async incrementCounter() {
    const dateKey = this.getDateKey();
    const ttl = this.getTtl();

    try {
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { dateKey },
        UpdateExpression: 'SET generationCount = if_not_exists(generationCount, :zero) + :inc, #ttl = :ttl',
        ExpressionAttributeNames: {
          '#ttl': 'ttl'
        },
        ExpressionAttributeValues: {
          ':inc': 1,
          ':zero': 0,
          ':ttl': ttl
        },
        ReturnValues: 'UPDATED_NEW'
      });

      const response = await this.docClient.send(command);
      return { newCount: response.Attributes.generationCount };
    } catch (error) {
      console.error('Error incrementing counter:', error);
      throw new Error(`Failed to update usage counter: ${error.message}`);
    }
  }

  /**
   * Check limit and increment in one atomic operation if allowed
   * @returns {Promise<{allowed: boolean, currentCount: number, limit: number}>}
   */
  async checkAndIncrement() {
    const dateKey = this.getDateKey();
    const ttl = this.getTtl();

    try {
      // Use conditional update to atomically check and increment
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { dateKey },
        UpdateExpression: 'SET generationCount = if_not_exists(generationCount, :zero) + :inc, #ttl = :ttl',
        ConditionExpression: 'attribute_not_exists(generationCount) OR generationCount < :limit',
        ExpressionAttributeNames: {
          '#ttl': 'ttl'
        },
        ExpressionAttributeValues: {
          ':inc': 1,
          ':zero': 0,
          ':ttl': ttl,
          ':limit': this.maxDailyGenerations
        },
        ReturnValues: 'UPDATED_NEW'
      });

      const response = await this.docClient.send(command);
      const newCount = response.Attributes.generationCount;

      return {
        allowed: true,
        currentCount: newCount,
        limit: this.maxDailyGenerations
      };
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        // Limit exceeded
        return {
          allowed: false,
          currentCount: this.maxDailyGenerations,
          limit: this.maxDailyGenerations
        };
      }
      console.error('Error in checkAndIncrement:', error);
      // On other errors, allow the request but log it
      return {
        allowed: true,
        currentCount: 0,
        limit: this.maxDailyGenerations,
        error: error.message
      };
    }
  }
}

module.exports = { UsageTrackerService };
