import { InteractionResponseType } from "discord-interactions";
import {
    BedrockRuntimeClient,
    ConverseCommand,
    Message
} from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB, DynamoDBServiceException } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { apiResponse } from "./utils";


const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';

const db = DynamoDBDocument.from(new DynamoDB());

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
  DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;

type InteractionOptions = {
    name: string,
    type: number,
    value: string
}

type InteractionData = {
    type: number,
    guild_id: number,
    id: number,
    name: string,
    options: [InteractionOptions]
}

enum ModelId {
    'SONNET' = 'anthropic.claude-3-sonnet-20240229-v1:0',
    'HAIKU'  = 'anthropic.claude-3-haiku-20240307-v1:0'
}
const modelId = ModelId.SONNET;

const client = new BedrockRuntimeClient({ region: "us-east-1" });


export async function logMatch(interaction: InteractionData, timestamp: number) {
    console.log(interaction);

    const matchData = interaction.options[0].value;
    const userMessage =
    `You are an AI record keeper for a disc golf league.
    Please parse this message containing the results of a disc golf route and output in JSON format with keys:
    "Name", "Date", "Tag number", "Course", "Layout".
    Message:
    The date is: ${timestamp}
    The results of the match are:
    ${matchData}

    For context, the message will usually begin with a course name and/or layout 
    Each players name will begin with an '@' symbol.
    The tag number for each player should be the final result of the round.

    Sometimes the course names are described using shorthand but I want \
    the table to show the full course name.
    For context, common courses that are played are:
    - Kentwood
    - Cedar Hills
    - Acorn Hill
    - Diavolo
    - Jones Park
    - Middle Creek
    - Valley Springs
    - Dorthea Dix
    - Buckhorn
    - Fit Fort (also sometimes called "Brews or Baskets")
    But there may be other courses played besides these.

    The course layouts are often named after colors.
    The message might not have values for one or more fields. If this is the case, please set the value to 'null'`;
    const message ={
        role: "user",
        content: [{ text: userMessage }],
    } as Message;
    
    // Create a command with the model ID, the message, and a basic configuration.
    const command = new ConverseCommand({
        modelId,
        messages: [message],
        inferenceConfig: { maxTokens: 512, temperature: 0.5, topP: 0.9 }
    });
    
    try {
        // Send the command to the model and wait for the response
        const response = await client.send(command);
    
        // Extract and print the response text.
        if (response?.output?.message?.content?.length && response?.output?.message?.content[0].text) {
            const responseJson = JSON.parse(response?.output?.message?.content[0].text);
            console.log(responseJson);
            responseJson[PRIMARY_KEY] = uuidv4();
            const params = {
                TableName: TABLE_NAME,
                Item: responseJson
            };
            try {
                db.put(params);
            } catch (dbError: unknown) {
                if (dbError instanceof DynamoDBServiceException) {
                    const errorResponse = dbError.name === 'ValidationException' && dbError.message.includes('reserved keyword') ?
                        RESERVED_RESPONSE : DYNAMODB_EXECUTION_ERROR;
                    return apiResponse(500, {
                        "type": InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                        "data": {
                            "content": errorResponse
                        }
                    });
                }
            }
            return apiResponse(200, {
                "type": InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                "data": {
                    "content": responseJson
                }
            });
        } else {
            console.log('ERROR: Could not get response text');
            return apiResponse(500)
        }
    } catch (err) {
        const msg = `ERROR: Can't invoke '${modelId}'. Reason: ${err}`
        console.log(msg);
        return apiResponse(200, {
            "type": InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            "data": {
                "content": msg
            }
        });
    }
}
