import { ChatInputCommandInteraction } from 'discord.js';

import logger from '../services/logger.js';

export const setupHandler = async (command: ChatInputCommandInteraction) => {
    const { guild, guildId, commandName } = command;

    logger.info(
        `Received command: /${commandName} from ${command.user.tag} in Guild: ${guild} (${guildId})`,
    );
};
