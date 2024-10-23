import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { TableV2, ITableV2, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';


export class SstsDataStack extends Stack {
    table: ITableV2;

    constructor(scope: Construct, id: string, opts: StackProps){
        super(scope, id, opts);

        new CfnOutput(this, 'TempOutput', {
            exportName: 'SstsDataStack:ExportsOutputRefDbClusterSecretAttachment4201A1ED69AEF80D',
            value: 'arn:aws:secretsmanager:us-east-1:897750996816:secret:DbClusterSecret9A4B0D5E-SQmqkOU6WoMC-mOtugG'
        });

        this.table = new TableV2(this, 'DbTable', {
            partitionKey: {
                name: 'uuid',
                type: AttributeType.STRING
            },
            tableName: 'log',
            removalPolicy: RemovalPolicy.DESTROY
        });
    }
}
