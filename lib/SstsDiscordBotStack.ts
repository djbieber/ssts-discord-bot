import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CodeSigningConfig } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Platform, SigningProfile } from 'aws-cdk-lib/aws-signer';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export class SstsDiscordBotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const botSecret = Secret.fromSecretNameV2(this, 'BotSecret', 'discord/ssts/zen-bot');

    // Set up a digital signature for the function so that
    // it can be checked whenever the function is invoked
    const signingProfile = new SigningProfile(this, 'SigningProfile', {
      platform: Platform.AWS_LAMBDA_SHA384_ECDSA,
    });
    const codeSigningConfig = new CodeSigningConfig(this, 'CodeSigningConfig', {
      signingProfiles: [signingProfile],
    });

    const backend = new NodejsFunction(this, 'Function', {
      bundling: {
        securityOpt: 'no-new-privileges'
      },
      codeSigningConfig
    });
    botSecret.grantRead(backend);
    backend.role?.addToPrincipalPolicy(new PolicyStatement({
      resources: ['arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'],
      actions: ['bedrock:InvokeModel']
    }));

    const api = new LambdaRestApi(this, 'SstsBotApi', {
      handler: backend,
      cloudWatchRole: true
    });
  }
}
