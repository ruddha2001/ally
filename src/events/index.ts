import { DiscordGatewayClient } from '../services/gatewayClient.js';
import { clientReadyHandler } from './clientReadyHandler.js';
import { guildCreateHandler } from './guildCreateHandler.js';

export const attachEventListeners = () => {
    DiscordGatewayClient.getClient().once('clientReady', () => {
        clientReadyHandler();
    });

    DiscordGatewayClient.getClient().on('guildCreate', (guild) => {
        guildCreateHandler(guild);
    });

    DiscordGatewayClient.getClient().on('interactionCreate', (interaction) => {});
};
