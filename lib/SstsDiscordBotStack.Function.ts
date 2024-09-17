import { APIGatewayEvent, Context } from "aws-lambda";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';

const pong = { "type": InteractionResponseType.PONG }

const zenisms = [
    "Slow is smooth, smooth is fast. -US Navy SEALs saying",
    "Play is the highest form of research. -Albert Einstein",
    "It's not what you look at that matters, it's what you see. -Henry David Thoreau",
    "You hit what you aim at and if you aim at nothing you will hit it every time. -Zig Ziglar",
    "Bad weather always looks worse through a window. -Tom Lehrer",
    "To breakthrough your performance, you've got to breakthrough your psychology. -Jensen Siaw"

]

function zen(){
    const theZen = zenisms[Math.floor(Math.random() * zenisms.length)];
    console.log(theZen);
    return {
        "type": InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        "data": {
            "content": theZen
        }
    }
}

async function getSecretValue(secretId: string, key?: string) {
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

export const handler = async function (event: APIGatewayEvent) {
    console.log(event);
    const { body } = event;
    if (!body) {
        console.error('No event body to process.');
        return false;
    }
    const jsonBody = JSON.parse(body);
    console.log(jsonBody);
    const public_key = await getSecretValue('discord/ssts/zen-bot', 'public_key');
    const signature = event.headers['x-signature-ed25519'];
    const timestamp = event.headers['x-signature-timestamp'];
    if (!signature || !timestamp) {
        console.log('Key verification headers missing from lambda event.')
        return {
            statusCode: 401,
            isBase64Encoded: false,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({"error": "Key verification headers missing from lambda event."})
        };        
    }
    const isValidRequest = await verifyKey(body, signature, timestamp, public_key);
    if (!isValidRequest) {
        console.log('Key verification failed.')
        return {
            statusCode: 401,
            isBase64Encoded: false,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({"error": "Key verification falied."})
        };
    }
    if (jsonBody.type === InteractionType.PING){
        console.log('Handling Ping event, returning Pong');
        const response = {
            statusCode: 200,
            isBase64Encoded: false,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pong),
        };
        console.log(response);
        return response;
    }
    var command = jsonBody.data?.name
    console.log(`Command: ${command}`);
    switch (command) {
        case 'zen':
            return {
                "type": InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                "data": {
                    "content": zen(),
                }
            }
    }
    return {
        "type": InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        "data": {
            "content": "BEEP BOOP"
        }
    }
};
