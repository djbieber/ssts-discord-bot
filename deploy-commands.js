const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config()

const botToken = process.env.BOT_TOKEN;
const appID = process.env.APPLICATION_ID;
const guildId = process.env.GUILD_ID;

if (!botToken || !appID || !guildId){
    throw Error(
        `Missing required environment variables: BOT_TOKEN, APPLICATION_ID, and/or GUILD_ID.
        Did you run with the correct .env in your project?`
    );
}

const commands = [];
// Grab all the command folders from the commands directory
const foldersPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(foldersPath);
for (const file of commandFiles) {
	const filePath = path.join(foldersPath, file);
	const command = JSON.parse(fs.readFileSync(filePath));
	commands.push(command);
}

const rest = new REST().setToken(botToken);
if(commands){
	(async () => {
		try {
			console.log(`Started refreshing ${commands.length} application (/) commands.`);

			// The put method is used to fully refresh all commands in the guild with the current set
			const data = await rest.put(
				Routes.applicationGuildCommands(appID, guildId),
				{ body: commands },
			);
			console.log(`Successfully reloaded ${data.length} application (/) commands.`);
		} catch (error) {
			console.error(error);
		}
	})();
}