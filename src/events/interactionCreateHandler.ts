import { ChatInputCommandInteraction, Interaction } from 'discord.js';

import { setupHandler } from '../commands/setupHandler.js';
import logger from '../lib/logger.js';
import { registerHandler } from '../commands/registerHandler.js';
import { applicantSettingsHandler } from '../commands/applicantSettingsHandler.js';

export const interactionCreateHandler = async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) {
        return;
    }
    const command = interaction as ChatInputCommandInteraction;
    const { guild, guildId, commandName } = command;

    if (!guild) {
        logger.warn(`/${commandName} was run outside of a guild.`);
        return await command.reply({
            content: `
Ally slash commands are meant to be run inside a Discord Server.`,
        });
    }

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

        case 'applicant_settings':
            applicantSettingsHandler(command);
            break;
    }
};
