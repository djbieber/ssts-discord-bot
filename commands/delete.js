const { REST, Routes } = require('discord.js');
require('dotenv').config()

const botToken = process.env.BOT_TOKEN;
const rest = new REST().setToken(botToken);

const appId = process.env.APPLICATION_ID;
const guildId = process.env.GUILD_ID;
const commandId = '1164664470786801736'
rest.delete(Routes.applicationCommand(appId, commandId))
	.then(() => console.log('Successfully deleted guild command'))
	.catch(console.error);
