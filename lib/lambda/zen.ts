import { InteractionResponseType } from 'discord-interactions';
import { apiResponse } from './utils';

const zenisms = [
    "Slow is smooth, smooth is fast. -US Navy SEALs saying",
    "Play is the highest form of research. -Albert Einstein",
    "It's not what you look at that matters, it's what you see. -Henry David Thoreau",
    "You hit what you aim at and if you aim at nothing you will hit it every time. -Zig Ziglar",
    "Bad weather always looks worse through a window. -Tom Lehrer",
    "To breakthrough your performance, you've got to breakthrough your psychology. -Jensen Siaw"
]

export function zen(){
    const theZen = zenisms[Math.floor(Math.random() * zenisms.length)];
    console.log(theZen);
    return apiResponse(200, {
        "type": InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        "data": {
            "content": theZen
        }
    });
}