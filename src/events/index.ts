import { DiscordGatewayClient } from '../lib/gatewayClient.js';
import { clientReadyHandler } from './clientReadyHandler.js';
import { guildCreateHandler } from './guildCreateHandler.js';
import { interactionCreateHandler } from './interactionCreateHandler.js';

export const attachEventListeners = () => {
    DiscordGatewayClient.getClient().once('clientReady', () => {
        clientReadyHandler();
    });

    DiscordGatewayClient.getClient().on('guildCreate', (guild) => {
        guildCreateHandler(guild);
    });

    DiscordGatewayClient.getClient().on('interactionCreate', (interaction) => {
        interactionCreateHandler(interaction);
    });
};
