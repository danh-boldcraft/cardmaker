const { RemovalPolicy, Duration } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const { Construct } = require('constructs');

/**
 * S3 bucket for storing AI-generated card images with automatic 48-hour expiration
 *
 * Features:
 * - Private bucket (accessed via presigned URLs only)
 * - Lifecycle policy: Auto-delete objects after 48 hours
 * - Versioning disabled (temporary images don't need versioning)
 * - CORS enabled for frontend uploads/downloads
 */
class ImageBucket extends Construct {
  constructor(scope, id, props = {}) {
    super(scope, id);

    const { environment = 'unknown' } = props;

    // Create S3 bucket for AI-generated images
    this.bucket = new s3.Bucket(this, 'ImageBucket', {
      bucketName: `cardmaker-images-${environment}`.toLowerCase(),

      // Security: Block all public access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,

      // Lifecycle: Auto-delete images after 48 hours
      lifecycleRules: [
        {
          id: 'DeleteAfter48Hours',
          enabled: true,
          expiration: Duration.hours(48),
          abortIncompleteMultipartUploadAfter: Duration.days(1),
        },
      ],

      // Versioning not needed for temporary images
      versioned: false,

      // Allow bucket deletion in non-prod environments
      removalPolicy: environment === 'production'
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== 'production',

      // CORS for frontend access via presigned URLs
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['*'], // Presigned URLs handle auth
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });
  }

  /**
   * Returns the S3 bucket instance
   */
  getBucket() {
    return this.bucket;
  }

  /**
   * Grant read/write permissions to a Lambda function
   */
  grantReadWrite(grantee) {
    return this.bucket.grantReadWrite(grantee);
  }
}

module.exports = { ImageBucket };
