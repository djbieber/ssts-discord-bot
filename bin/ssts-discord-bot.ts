#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SstsDiscordBotStack } from '../lib/SstsDiscordBotStack';

const app = new cdk.App();
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };
new SstsDiscordBotStack(app, 'SstsDiscordBotStack', { env });
