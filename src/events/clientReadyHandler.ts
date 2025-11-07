import { ActivityType } from 'discord.js';
import { DiscordGatewayClient } from '../lib/gatewayClient.js';
import logger from '../lib/logger.js';

export const clientReadyHandler = () => {
    logger.info(`✅ Ally has started as ${DiscordGatewayClient.getClient().user?.tag}`);

    DiscordGatewayClient.getClient().user?.setPresence({
        activities: [
            {
                name: 'custom-status',
                type: ActivityType.Custom,
                state: '👷‍♂️ Working hard at ally.ani.codes',
            },
        ],
        status: 'online',
    });
};
