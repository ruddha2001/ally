import { DiscordGatewayClient } from '../lib/gatewayClient.js';
import logger from '../lib/logger.js';

export const clientReadyHandler = () => {
    logger.info(`✅ Ally has started as ${DiscordGatewayClient.getClient().user?.tag}`);
};
