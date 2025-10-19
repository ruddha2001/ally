import { DiscordGatewayClient } from '../services/gatewayClient.js';
import logger from '../services/logger.js';

export const clientReadyHandler = () => {
    logger.info(`✅ Ally has started as ${DiscordGatewayClient.getClient().user?.tag}`);
};
