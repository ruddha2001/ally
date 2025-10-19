import { ChatInputCommandInteraction, Interaction } from 'discord.js';

import { setupHandler } from '../commands/setupHandler.js';
import logger from '../lib/logger.js';
import { registerHandler } from '../commands/registerHandler.js';

export const interactionCreateHandler = (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) {
        return;
    }
    const command = interaction as ChatInputCommandInteraction;
    const { guild, guildId, commandName } = command;

    logger.debug(
        `Received command: /${commandName} from ${command.user.tag} in Guild: ${guild} (${guildId})`,
    );

    switch (commandName) {
        case 'setup':
            setupHandler(command);
            break;
        case 'register':
            registerHandler(command);
            break;
    }
};
