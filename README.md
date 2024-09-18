# SSTS Discord Bot
The handy bot that logs our tag rounds and more!

### System requirements

1. Node.js 20
2. https://pnpm.io/installation
3. Docker

### Repo setup

1. Clone
2. pnpm install

### Contributing

The majority of the application code that runs is in `lib/lambda`. If new handlers are added there, they also need to be added to `lib/SstsDiscordBotStack.Function.ts`.

The rest of `lib` is the AWS infrastructure that the discord app runs on and can be updated as needed to accomodate the needs of the application.
