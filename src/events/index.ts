import { DiscordGatewayClient } from '../lib/gatewayClient.js';
import { clientReadyHandler } from './clientReadyHandler.js';
import { guildCreateHandler } from './guildCreateHandler.js';
import { guildMemberAddHandler } from './guildMemberAddHandler.js';
import { interactionCreateHandler } from './interactionCreateHandler.js';

/**
 * Attach event listeners to the Discord gateway client.
 *
 * Registers the following handlers on the client retrieved from
 * DiscordGatewayClient.getClient():
 * - 'clientReady' (registered with once) -> clientReadyHandler
 * - 'guildCreate' -> guildCreateHandler
 * - 'interactionCreate' -> interactionCreateHandler
 * - 'guildMemberAdd' -> guildMemberAddHandler
 *
 * This function is intended to be called during application startup to wire
 * the imported event handlers to the gateway client. Calling it multiple
 * times without removing listeners may result in duplicate handler invocations.
 *
 * @remarks
 * - The actual handler implementations are imported from their respective
 *   modules and are responsible for handling event payloads and any
 *   asynchronous logic.
 * - Any errors thrown by DiscordGatewayClient.getClient() or by individual
 *   handlers will propagate to the caller.
 *
 * @public
 * @returns {void} No value is returned.
 */
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

    DiscordGatewayClient.getClient().on('guildMemberAdd', (member) => {
        guildMemberAddHandler(member);
    });
};
