import * as dotenv from 'dotenv';
dotenv.config();

import { DiscordGatewayClient } from './services/gatewayClient.js';
import { DiscordRestClient } from './services/restClient.js';
import { attachEventListeners } from './events/index.js';

const initApp = async () => {
    attachEventListeners();

    DiscordGatewayClient.getClient().login(process.env.DISCORD_TOKEN);
    DiscordRestClient.registerGlobalCommands(
        process.env.DISCORD_TOKEN as string,
        process.env.DISCORD_CLIENT_ID as string,
        process.env.DISCORD_TEST_GUILD_ID as string,
    );
};

initApp();
