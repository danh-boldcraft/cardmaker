const { Stack, Duration, CfnOutput, RemovalPolicy } = require('aws-cdk-lib');
const lambda = require('aws-cdk-lib/aws-lambda');
const apigateway = require('aws-cdk-lib/aws-apigateway');
const dynamodb = require('aws-cdk-lib/aws-dynamodb');
const s3 = require('aws-cdk-lib/aws-s3');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const iam = require('aws-cdk-lib/aws-iam');
const path = require('path');
const fs = require('fs');
const { ImageBucket } = require('./constructs/image-bucket');
const { WafIpAllowlist } = require('./constructs/waf-ip-allowlist');

class CardmakerStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Load environment-specific configuration
    const deployEnv = process.env.DEPLOY_ENV || 'local';
    const configPath = path.join(__dirname, `../config/${deployEnv}.json`);

    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}. Please create it or set DEPLOY_ENV correctly.`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log(`📦 Deploying ${config.stackName} (${config.environment} environment)`);

    // Determine environment-specific key names based on DEPLOY_ENV
    const envPrefix = deployEnv.toUpperCase();
    const publicKeyVar = `CM_MEMBERSTACK_${envPrefix}_PUBLIC_KEY`;
    const secretKeyVar = `CM_MEMBERSTACK_${envPrefix}_SECRET_KEY`;

    // Validate required environment variables for all deployments
    const requiredVars = [publicKeyVar, secretKeyVar];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error(`\n❌ Missing required environment variables for ${config.environment} deployment:`);
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      console.error(`\nSet these variables before deploying to ${config.environment}.`);
      console.error('See .env.example for reference.\n');
      throw new Error('Missing required environment variables');
    }

    // Create S3 bucket for AI-generated card images
    const imageBucket = new ImageBucket(this, 'CardImageBucket', {
      environment: config.environment,
    });

    // Create DynamoDB table for usage tracking (daily generation limits)
    const usageTable = new dynamodb.Table(this, 'UsageTable', {
      tableName: `cardmaker-usage-${config.environment}`,
      partitionKey: { name: 'dateKey', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: config.environment === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl', // Auto-cleanup old records
    });

    // Create Lambda function
    const multiplyFunction = new lambda.Function(this, 'MultiplyFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/lambda')),
      timeout: Duration.seconds(config.lambda.timeout),
      memorySize: config.lambda.memorySize,
      description: `Cardmaker API handler (${config.environment})`,
      environment: {
        ENVIRONMENT: config.environment,
        DEBUG_MODE: config.features.debugMode.toString(),
        // Secrets from environment-specific variables (set before deployment)
        MEMBERSTACK_PUBLIC_KEY: process.env[publicKeyVar] || '',
        MEMBERSTACK_SECRET_KEY: process.env[secretKeyVar] || '',
        // Image generation configuration
        IMAGE_BUCKET_NAME: imageBucket.getBucket().bucketName,
        BEDROCK_REGION: config.bedrock.region,
        BEDROCK_IMAGE_MODEL: config.bedrock.imageModel,
        BEDROCK_IMAGE_WIDTH: config.bedrock.imageWidth.toString(),
        BEDROCK_IMAGE_HEIGHT: config.bedrock.imageHeight.toString(),
        BEDROCK_IMAGE_QUALITY: config.bedrock.imageQuality,
        // Guardrails
        MAX_DAILY_GENERATIONS: config.guardrails.maxDailyGenerations.toString(),
        MAX_DAILY_ORDERS: config.guardrails.maxDailyOrders.toString(),
        // Usage tracking
        USAGE_TABLE_NAME: usageTable.tableName,
        // Shopify configuration (from env vars)
        SHOPIFY_STORE_DOMAIN: process.env.CM_SHOPIFY_STORE_DOMAIN || '',
        SHOPIFY_ACCESS_TOKEN: process.env.CM_SHOPIFY_ACCESS_TOKEN || '',
        SHOPIFY_CARD_PRODUCT_ID: process.env.CM_SHOPIFY_CARD_PRODUCT_ID || '',
        SHOPIFY_WEBHOOK_SECRET: process.env.CM_SHOPIFY_WEBHOOK_SECRET || '',
        // Printify configuration (from env vars)
        PRINTIFY_API_KEY: process.env.CM_PRINTIFY_API_KEY || '',
        PRINTIFY_SHOP_ID: process.env.CM_PRINTIFY_SHOP_ID || '',
        PRINTIFY_CARD_BLUEPRINT_ID: process.env.CM_PRINTIFY_CARD_BLUEPRINT_ID || ''
      }
      // Note: Not setting reservedConcurrentExecutions to use account's default
      // API Gateway throttling provides rate limiting
    });

    // Grant Lambda permissions to access S3 image bucket
    imageBucket.grantReadWrite(multiplyFunction);

    // Grant Lambda permissions to access DynamoDB usage table
    usageTable.grantReadWriteData(multiplyFunction);

    // Grant Lambda permissions to invoke Bedrock models
    multiplyFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: [
          `arn:aws:bedrock:${config.bedrock.region}::foundation-model/${config.bedrock.imageModel}`,
        ],
      })
    );

    // Create API Gateway REST API
    const api = new apigateway.RestApi(this, 'CardmakerApi', {
      restApiName: `Cardmaker Service (${config.environment})`,
      description: `Cardmaker API - ${config.environment} environment`,
      deployOptions: {
        stageName: 'api',
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

    // Add IP-based resource policy for API Gateway (Phase 1B)
    // This restricts API access to whitelisted IPs only
    if (config.guardrails.allowedIps && config.guardrails.allowedIps.length > 0) {
      console.log(`🔒 Adding IP restriction policy for ${config.guardrails.allowedIps.length} IP(s)`);

      // First, add an ALLOW statement for all requests
      const allowPolicy = new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ['execute-api:Invoke'],
        resources: ['execute-api:/*']
      });
      api.addToResourcePolicy(allowPolicy);

      // Then, add a DENY statement for IPs NOT in the allowlist
      const ipRestrictionPolicy = new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['execute-api:Invoke'],
        resources: ['execute-api:/*'],
        conditions: {
          NotIpAddress: {
            'aws:SourceIp': config.guardrails.allowedIps
          }
        }
      });

      api.addToResourcePolicy(ipRestrictionPolicy);
      console.log(`   Allowed IPs: ${config.guardrails.allowedIps.join(', ')}`);
    } else {
      console.log('⚠️  No IP allowlist configured - API is accessible from any IP');
    }

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

    // Create /member-info resource
    const memberInfoResource = api.root.addResource('member-info');

    // Add POST method to /member-info
    memberInfoResource.addMethod('POST', lambdaIntegration, {
      throttling: {
        rateLimit: config.apiGateway.methodThrottling.rateLimit,
        burstLimit: config.apiGateway.methodThrottling.burstLimit
      }
    });

    // Create /generate-card resource for AI image generation
    const generateCardResource = api.root.addResource('generate-card');

    // Add POST method to /generate-card with stricter throttling (5 req/min = 0.083 req/sec)
    generateCardResource.addMethod('POST', lambdaIntegration, {
      throttling: {
        rateLimit: 1,  // 1 request per second max
        burstLimit: 5  // Allow burst of 5 requests
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

    // Note: WAF for CloudFront requires us-east-1 region (global service requirement)
    // For POC, WAF IP allowlist is disabled. To enable, create a cross-region stack.
    // See: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_wafv2-readme.html
    console.log('⚠️  WAF IP allowlist disabled - requires us-east-1 cross-region setup for CloudFront');
    console.log('   Access control will rely on API Gateway throttling and S3 presigned URLs');

    // Create CloudFront distribution for HTTPS
    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      comment: config.cloudfront.comment,
      // webAclId: undefined, // WAF disabled for POC
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity: originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECM_TO_HTTPS, // Redirect HTTP to HTTPS
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

    // Prepare config.js with injected Memberstack public key
    const configJsPath = path.join(__dirname, '../public/config.js');
    let configJsContent = fs.readFileSync(configJsPath, 'utf8');

    // Inject environment-specific Memberstack public key
    const memberstackPublicKey = process.env[publicKeyVar] || 'MEMBERSTACK_PUBLIC_KEY_NOT_SET';
    configJsContent = configJsContent.replace(
      new RegExp(`${deployEnv}: 'MEMBERSTACK_PUBLIC_KEY_PLACEHOLDER'`),
      `${deployEnv}: '${memberstackPublicKey}'`
    );

    // Write modified config.js to a temporary directory
    const tempDir = path.join(__dirname, '../.tmp-deploy');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    fs.writeFileSync(path.join(tempDir, 'config.js'), configJsContent);

    // Deploy frontend files to S3 and invalidate CloudFront cache
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, '../public')),
        s3deploy.Source.asset(tempDir) // Overwrite config.js with injected version
      ],
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
      description: `Multiply endpoint URL (${config.environment})`
    });

    new CfnOutput(this, 'GenerateCardEndpoint', {
      value: `${api.url}generate-card`,
      description: `Generate card endpoint URL (${config.environment})`
    });

    new CfnOutput(this, 'UsageTableName', {
      value: usageTable.tableName,
      description: `DynamoDB usage tracking table (${config.environment})`
    });

    new CfnOutput(this, 'WebsiteUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: `Frontend Website URL - ${config.environment} environment`
    });

    new CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
      description: `CloudFront distribution domain (${config.environment})`
    });

    new CfnOutput(this, 'ImageBucketName', {
      value: imageBucket.getBucket().bucketName,
      description: `S3 bucket for AI-generated card images (${config.environment})`
    });
  }
}

module.exports = { CardmakerStack };
