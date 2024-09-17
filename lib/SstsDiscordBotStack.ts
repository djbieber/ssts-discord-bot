import * as cdk from 'aws-cdk-lib';
import { Role } from 'aws-cdk-lib/aws-iam';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { CodeSigningConfig } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Platform, SigningProfile } from 'aws-cdk-lib/aws-signer';

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

    const api = new LambdaRestApi(this, 'SstsBotApi', {
      handler: backend,
      cloudWatchRole: true
    });
  }
}
