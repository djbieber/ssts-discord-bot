import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { InteractionResponseType } from 'discord-interactions';

export const pong = { "type": InteractionResponseType.PONG }


export async function getSecretValue(secretId: string, key?: string) {
    const client = new SecretsManagerClient();
    const command = new GetSecretValueCommand({ SecretId: secretId });
    const response = await client.send(command);
    if (response.SecretString) {
        if (key) {
            const value = JSON.parse(response.SecretString)[key];
            if (!value) {
                throw Error('Requested key not in secret string.');
            }
            return value;
        }
        return response.SecretString;
    }
    console.log('Response did not contain secret string:');
    console.log(response);
    throw Error('Unable to get required secret value');
}

export function apiResponse(statusCode: number, body: object) {
    // Add response schema required by API Gateway
    const response = {
        statusCode,
        isBase64Encoded: false,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    };
    console.log(response);
    return response;
}
