import { InteractionResponseType } from "discord-interactions";
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

export function logMatch(interaction: InteractionData) {
    console.log(interaction);
    return apiResponse(200, {
        "type": InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        "data": {
            "content": interaction.options[0].value
        }
    });
}
