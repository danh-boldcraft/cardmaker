const { Stack, Duration, CfnOutput, RemovalPolicy } = require('aws-cdk-lib');
const lambda = require('aws-cdk-lib/aws-lambda');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const s3 = require('aws-cdk-lib/aws-s3');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const path = require('path');
const fs = require('fs');

class MultiplyStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Load environment-specific configuration
    const deployEnv = process.env.DEPLOY_ENV || 'test';
    const configPath = path.join(__dirname, `../config/${deployEnv}.json`);

    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}. Please create it or set DEPLOY_ENV correctly.`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log(`📦 Deploying ${config.stackName} (${config.environment} environment)`);


    // Create Lambda function
    const multiplyFunction = new lambda.Function(this, 'MultiplyFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/lambda')),
      timeout: Duration.seconds(config.lambda.timeout),
      memorySize: config.lambda.memorySize,
      description: `Multiplies a number by 3 (${config.environment})`,
      environment: {
        ENVIRONMENT: config.environment,
        DEBUG_MODE: config.features.debugMode.toString(),
        // Placeholder for future payment integration
        // STRIPE_SECRET_KEY: config.secrets?.stripe?.secretKey || '',
        // MEMBERSTACK_SECRET_KEY: config.secrets?.memberstack?.secretKey || ''
      }
      // Note: Not setting reservedConcurrentExecutions to use account's default
      // API Gateway throttling provides rate limiting
    });

    // Create API Gateway REST API
    const api = new apigateway.RestApi(this, 'MultiplyApi', {
      restApiName: `Multiply Service (${config.environment})`,
      description: `API for multiplying numbers by 3 - ${config.environment} environment`,
      deployOptions: {
        stageName: 'prod',
        // Global throttling for the entire API
        throttlingRateLimit: config.apiGateway.throttling.rateLimit,
        throttlingBurstLimit: config.apiGateway.throttling.burstLimit
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
        rateLimit: config.apiGateway.methodThrottling.rateLimit,
        burstLimit: config.apiGateway.methodThrottling.burstLimit
      }
    });

    // Create S3 bucket for static website hosting (private, accessed via CloudFront)
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      removalPolicy: RemovalPolicy.DESTROY, // Allows bucket deletion on stack destroy
      autoDeleteObjects: true, // Clean up objects on bucket deletion
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Block all public access - CloudFront will access via OAC
      publicReadAccess: false,
    });

    // Create Origin Access Identity for CloudFront to access S3
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${config.stackName}`,
    });

    // Grant CloudFront OAI read permissions to the bucket
    websiteBucket.grantRead(originAccessIdentity);

    // Create CloudFront distribution for HTTPS
    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      comment: config.cloudfront.comment,
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity: originAccessIdentity,
        }),
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

    // Output deployment information
    new CfnOutput(this, 'Environment', {
      value: config.environment,
      description: 'Deployment environment (local/test/prod)'
    });

    new CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: `API Gateway URL (${config.environment})`
    });

    new CfnOutput(this, 'MultiplyEndpoint', {
      value: `${api.url}multiply`,
      description: `Multiply endpoint URL (${config.environment}) - Update this in public/config.js`
    });

    new CfnOutput(this, 'WebsiteUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: `Frontend Website URL - ${config.environment} environment`
    });

    new CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
      description: `CloudFront distribution domain (${config.environment})`
    });
  }
}

module.exports = { MultiplyStack };
