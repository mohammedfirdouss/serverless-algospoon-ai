#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AlgoSpoonStack } from '../lib/algospoon-stack';

const app = new cdk.App();

new AlgoSpoonStack(app, 'AlgoSpoonStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'AlgoSpoon AI - Personalized Recipe Generation with AWS Bedrock',
});

app.synth();
