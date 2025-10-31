import { REST, Routes } from 'discord.js';
import { commandList } from '../commands/index.js';
import logger from './logger.js';

/**
 * Singleton wrapper for the Discord.js REST client.
 *
 * This class manages a single instance of the Discord.js REST client and provides
 * methods to register application commands with Discord, supporting both global and
 * guild-specific command registration based on the environment.
 */
export class DiscordRestClient {
    /**
     * The singleton REST client instance, or null if not yet initialized.
     */
    private static client: REST | null = null;

    /**
     * Initializes the REST client with the provided bot token.
     *
     * @param token The Discord bot token to authenticate the REST client.
     * @private
     */
    private static initClient(token: string) {
        this.client = new REST().setToken(token);
    }

    /**
     * Registers application (slash) commands with Discord.
     *
     * In development, commands are registered for a specific guild; in production,
     * they are registered globally. Logs the result or any errors using the logger.
     *
     * @param token The Discord bot token.
     * @param clientId The Discord application client ID.
     * @param guildId (optional) The guild ID for development command registration.
     * @returns {Promise<void>} Resolves when registration is complete.
     */
    static async registerCommands(token: string, clientId: string, guildId: string = '') {
        if (!DiscordRestClient.client) {
            DiscordRestClient.initClient(token);
        }
        try {
            const data: any = await DiscordRestClient.client?.put(
                process.env.NODE_ENV === 'development'
                    ? Routes.applicationGuildCommands(clientId, guildId)
                    : Routes.applicationCommands(clientId),
                {
                    body: commandList,
                },
            );
            logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
            logger.error('Failed to deploy commands:', error);
        }
    }
}
