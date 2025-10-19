import { REST, Routes } from 'discord.js';
import { commandList } from '../commands/index.js';
import logger from './logger.js';

export class DiscordRestClient {
    private static client: REST | null = null;

    private static initClient(token: string) {
        this.client = new REST().setToken(token);
    }

    static async registerGlobalCommands(token: string, clientId: string) {
        if (!DiscordRestClient.client) {
            DiscordRestClient.initClient(token);
        }
        try {
            const data: any = await DiscordRestClient.client?.put(
                Routes.applicationCommands(clientId),
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
