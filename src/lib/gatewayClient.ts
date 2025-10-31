import { Client, GatewayIntentBits } from 'discord.js';

/**
 * Singleton wrapper for the Discord.js gateway client.
 *
 * This class ensures that only one instance of the Discord.js Client is created and used
 * throughout the application. It provides lazy initialization and exposes a static method
 * to retrieve the client instance, initializing it if necessary.
 */
export class DiscordGatewayClient {
    /**
     * The singleton Discord.js Client instance, or null if not yet initialized.
     */
    private static client: Client | null = null;

    /**
     * Initializes the Discord.js Client with required gateway intents.
     *
     * @private
     */
    private static initClient() {
        DiscordGatewayClient.client = new Client({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
        });
    }

    /**
     * Retrieves the singleton Discord.js Client instance, initializing it if needed.
     *
     * @returns {Client} The Discord.js Client instance.
     */
    static getClient(): Client {
        if (!DiscordGatewayClient.client) {
            DiscordGatewayClient.initClient();
        }
        return DiscordGatewayClient.client as Client;
    }
}
