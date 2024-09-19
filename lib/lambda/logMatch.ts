import { InteractionResponseType } from "discord-interactions";
import {
    BedrockRuntimeClient,
    ConverseCommand,
    Message
  } from "@aws-sdk/client-bedrock-runtime";
import { apiResponse } from "./utils";

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

const client = new BedrockRuntimeClient({ region: "us-east-1" });
const modelId = "anthropic.claude-3-haiku-20240307-v1:0";


export async function logMatch(interaction: InteractionData, timestamp: number) {
    console.log(interaction);
    const matchData = interaction.options[0].value;
    const userMessage =
    `Please parse a message to fill out a table with the following columns:
    Name, Date, Tag number, Course, Layout

    Usually the message will begin with a course name and/or layout 
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
    The message might not contain one or more fields, in which case that field can be left blank.
    This is the message that I would like to populate the table with:
    Date: ${timestamp}
    ${matchData}
    
    Please return the table in JSON format.`;
    const message ={
        role: "user",
        content: [{ text: userMessage }],
    } as Message;
    
    // Create a command with the model ID, the message, and a basic configuration.
    const command = new ConverseCommand({
        modelId,
        messages: [message],
        inferenceConfig: { maxTokens: 512, temperature: 0.5, topP: 0.9 },
    });
    
    try {
        // Send the command to the model and wait for the response
        const response = await client.send(command);
    
        // Extract and print the response text.
        if (response?.output?.message?.content?.length) {
            const responseText = response?.output?.message?.content[0].text;
            console.log(responseText);
            return apiResponse(200, {
                "type": InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                "data": {
                    "content": responseText
                }
            });
        }
    } catch (err) {
        console.log(`ERROR: Can't invoke '${modelId}'. Reason: ${err}`);
        return apiResponse(500);
    }
}
