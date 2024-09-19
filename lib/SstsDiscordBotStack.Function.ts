import { APIGatewayEvent } from "aws-lambda";
import { verifyKey, InteractionType, InteractionResponseType } from 'discord-interactions';
import { pong, getSecretValue, apiResponse } from './lambda/utils.js';
import { zen } from './lambda/zen.js';
import { logMatch } from './lambda/logMatch.js'

export const handler = async function (event: APIGatewayEvent) {
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
        return apiResponse(401, {error: "Key verification headers missing from lambda event."});
    }
    const isValidRequest = await verifyKey(body, signature, timestamp, public_key);
    if (!isValidRequest) {
        console.log('Key verification failed.');
        return apiResponse(401, {"error": "Key verification falied."});
    }
    if (jsonBody.type === InteractionType.PING){
        console.log('Handling Ping event, returning Pong');
        return apiResponse(200, pong);
    }
    var command = jsonBody.data?.name
    console.log(`Command: ${command}`);
    switch (command) {
        case 'zen':
            return zen();
        case 'log_a_match':
            return logMatch(jsonBody.data, timestamp);
    }
    return apiResponse(200, {
        "type": InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        "data": {
            "content": "BEEP BOOP"
        }
    });
};
