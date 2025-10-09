#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AlgoSpoonStack } from '../lib/algospoon-stack';
import { getConfig, getStackName } from '../lib/config';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || process.env.ENVIRONMENT || 'dev';

// Get configuration for the environment
const config = getConfig(environment);

// Create stack with environment-specific config
new AlgoSpoonStack(app, getStackName('AlgoSpoonStack', environment), {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `AlgoSpoon AI - Personalized Recipe Generator with AWS Bedrock (${environment})`,
  config,
});

app.synth();
