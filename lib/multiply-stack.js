const { Stack, Duration, CfnOutput, RemovalPolicy } = require('aws-cdk-lib');
const lambda = require('aws-cdk-lib/aws-lambda');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const s3 = require('aws-cdk-lib/aws-s3');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const path = require('path');

class MultiplyStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create Lambda function
    const multiplyFunction = new lambda.Function(this, 'MultiplyFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/lambda')),
      timeout: Duration.seconds(10),
      memorySize: 128,
      description: 'Multiplies a number by 3'
      // Note: Not setting reservedConcurrentExecutions to use account's default
      // API Gateway throttling (10 req/sec, burst 20) provides rate limiting
    });

    // Create API Gateway REST API
    const api = new apigateway.RestApi(this, 'MultiplyApi', {
      restApiName: 'Multiply Service',
      description: 'API for multiplying numbers by 3',
      deployOptions: {
        stageName: 'prod',
        // Global throttling for the entire API
        throttlingRateLimit: 100,      // 100 requests per second
        throttlingBurstLimit: 200      // Allow bursts up to 200 requests
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    // Create /multiply resource
    const multiplyResource = api.root.addResource('multiply');

    // Add POST method to /multiply
    const lambdaIntegration = new apigateway.LambdaIntegration(multiplyFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' }
    });

    // Add method with specific throttling for the multiply endpoint
    multiplyResource.addMethod('POST', lambdaIntegration, {
      throttling: {
        rateLimit: 10,     // 10 requests per second
        burstLimit: 20     // Allow bursts up to 20 requests
      }
    });

    // Create S3 bucket for static website hosting (private, accessed via CloudFront)
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      removalPolicy: RemovalPolicy.DESTROY, // Allows bucket deletion on stack destroy
      autoDeleteObjects: true, // Clean up objects on bucket deletion
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Block all public access - CloudFront will access via OAC
    });

    // Create CloudFront distribution for HTTPS
    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS, // Redirect HTTP to HTTPS
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED, // Aggressive caching
        compress: true, // Enable gzip/brotli compression
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(5),
        },
      ],
    });

    // Deploy frontend files to S3 and invalidate CloudFront cache
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../public'))],
      destinationBucket: websiteBucket,
      distribution: distribution, // Invalidate CloudFront cache on deployment
      distributionPaths: ['/*'], // Invalidate all files
    });

    // Output the API URL
    new CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'URL of the API Gateway'
    });

    new CfnOutput(this, 'MultiplyEndpoint', {
      value: `${api.url}multiply`,
      description: 'Multiply endpoint URL - Update this in public/config.js'
    });

    // Output the CloudFront HTTPS website URL
    new CfnOutput(this, 'WebsiteUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Frontend Website URL (HTTPS via CloudFront)'
    });

    new CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain name'
    });
  }
}

module.exports = { MultiplyStack };
