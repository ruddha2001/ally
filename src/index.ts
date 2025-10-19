import * as dotenv from 'dotenv';
dotenv.config();

import { DiscordGatewayClient } from './lib/gatewayClient.js';
import { DiscordRestClient } from './lib/restClient.js';
import { attachEventListeners } from './events/index.js';
import { Database } from './lib/mongoDbClient.js';

const initApp = async () => {
    attachEventListeners();

    await Database.connectClient();
    DiscordGatewayClient.getClient().login(process.env.DISCORD_TOKEN);
    DiscordRestClient.registerGlobalCommands(
        process.env.DISCORD_TOKEN as string,
        process.env.DISCORD_CLIENT_ID as string,
        process.env.DISCORD_TEST_GUILD_ID as string,
    );
};

const shutdown = async () => {
    await Database.closeConnection();
    console.log('Shutdown complete.');
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

initApp();
