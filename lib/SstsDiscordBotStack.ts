import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CodeSigningConfig } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Platform, SigningProfile } from 'aws-cdk-lib/aws-signer';
import { ITableV2 } from 'aws-cdk-lib/aws-dynamodb';

interface SstsDiscordBotStackOptions extends cdk.StackProps {
  table: ITableV2;
}

export class SstsDiscordBotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, opts: SstsDiscordBotStackOptions) {
    super(scope, id, opts);

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
    opts.table.grantReadWriteData(backend);
    backend.addToRolePolicy(new PolicyStatement({
      resources: [
        'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
        'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0'
      ],
      actions: ['bedrock:InvokeModel']
    }));

    new LambdaRestApi(this, 'SstsBotApi', {
      handler: backend,
      cloudWatchRole: true
    });
  }
}
