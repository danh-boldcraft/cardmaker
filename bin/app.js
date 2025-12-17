#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

// This file is used for deployment.
// npm scripts set DEPLOY_ENV. CDK auto-detects AWS account/region from your AWS CLI config.
const cdk = require('aws-cdk-lib');
const { CardmakerStack } = require('../lib/cardmaker-stack');
const fs = require('fs');
const path = require('path');

const app = new cdk.App();

// Load environment-specific configuration
const deployEnv = process.env.DEPLOY_ENV || 'test';
const configPath = path.join(__dirname, `../config/${deployEnv}.json`);

if (!fs.existsSync(configPath)) {
  console.error(`❌ Config file not found: ${configPath}`);
  console.error(`   Available environments: local, test, prod`);
  console.error(`   Set DEPLOY_ENV environment variable or create the config file.`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Create stack with environment-specific name
new CardmakerStack(app, config.stackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || config.aws?.account,
    region: process.env.CDK_DEFAULT_REGION || config.aws?.region || 'us-west-2'
  },
  description: `${config.description} - Deployed via CDK`
});

app.synth();
