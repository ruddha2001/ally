import { Client, GatewayIntentBits, TextChannel } from 'discord.js';

export class DiscordGatewayClient {
    private static client: Client | null = null;

    private static initClient() {
        DiscordGatewayClient.client = new Client({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
        });
    }

    static getClient(): Client {
        if (!DiscordGatewayClient.client) {
            DiscordGatewayClient.initClient();
        }
        return DiscordGatewayClient.client as Client;
    }
}
