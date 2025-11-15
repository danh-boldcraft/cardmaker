#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const { MultiplyStack } = require('../lib/multiply-stack');

const app = new cdk.App();

new MultiplyStack(app, 'MultiplyServiceStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  },
  description: 'Stack for the multiply by 2 service'
});

app.synth();
