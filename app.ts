#!/usr/bin/env node
import 'source-map-support/register.js';
import * as cdk from 'aws-cdk-lib';
import { ClockWebsiteStack } from './lib/clock-website-stack.js';

const app = new cdk.App();
const environment = app.node.tryGetContext('environment') || 'development'; // Read environment context, default to 'development'
const stackId = `ClockWebsiteStack-${environment}`; // Create a unique stack ID based on environment

new ClockWebsiteStack(app, stackId, {
  environment: environment,
  envVars: process.env, // Pass process.env to the stack
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but you can deploy to any account and region. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
