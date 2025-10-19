import * as dotenv from 'dotenv';

import { DiscordGatewayClient } from './services/gatewayClient.js';
import { DiscordRestClient } from './services/restClient.js';
import { attachEventListeners } from './events/index.js';

const initApp = async () => {
    dotenv.config();

    attachEventListeners();

    DiscordGatewayClient.getClient().login(process.env.DISCORD_TOKEN);
    DiscordRestClient.registerGlobalCommands(
        process.env.DISCORD_TOKEN as string,
        process.env.DISCORD_CLIENT_ID as string,
    );
};

initApp();
