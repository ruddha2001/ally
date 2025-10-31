import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Interaction,
} from 'discord.js';

import { setupHandler } from '../commands/setupHandler.js';
import logger from '../lib/logger.js';
import { registerHandler } from '../commands/registerHandler.js';
import { applicantSettingsHandler } from '../commands/applicantSettingsHandler.js';
import { BUTTONS } from '../../constants.js';
import { applyForAllianceHandler } from '../buttons/applyForAllianceHandler.js';
import { AllyError } from '../shared/allyError.js';

export const interactionCreateHandler = async (interaction: Interaction) => {
    // TODO handle no matching case
    if (interaction.isButton()) {
        const command = interaction as ButtonInteraction;
        const { guild, guildId, customId } = command;

        if (!guild) {
            logger.warn(`Button ${customId} was used outside of a guild.`);
            return await command.reply({
                content: `
Ally button commands are meant to be used inside a Discord Server.`,
            });
        }

        logger.debug(
            `Received button interaction: ${customId} from ${command.user.tag} in Guild: ${guild} (${guildId})`,
        );

        switch (customId) {
            case BUTTONS.APPLY_BUTTON: {
                applyForAllianceHandler(command);
                break;
            }
        }
    }

    if (interaction.isChatInputCommand()) {
        const command = interaction as ChatInputCommandInteraction;
        const { guild, guildId, commandName } = command;

        if (!guild) {
            logger.warn(`/${commandName} was run outside of a guild.`);
            return await command.reply({
                content: `
Ally slash commands are meant to be run inside a Discord Server.`,
            });
        }

        logger.info(
            `Received command: /${commandName} from User: ${command.user.tag} in Guild: ${guild} inside Channel: ${guild.channels.cache.get(command.channel?.id ?? '')?.name}`,
        );

        try {
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

                case 'glance':
                    break;
            }
        } catch (error) {
            logger.error(error);
            if (!command.replied) {
                if (error instanceof AllyError && error.description) {
                    await command.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Orange')
                                .setTitle(
                                    `There was an issue executing /${command.commandName} for you`,
                                )
                                .setDescription(error.description)
                                .setFooter({
                                    text: 'You can retry this operation by following the instructions above, ensuring you are entering correct parameters. If the issue persists, raise a ticket at https://ally.ani.codes/support',
                                }),
                        ],
                    });
                } else {
                    await command.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Red')
                                .setTitle('Unexpected Error')
                                .setDescription(
                                    `Well I encountered an error that I do not know how to deal with.`,
                                )
                                .addFields({ name: 'command', value: command.commandName })
                                .setFooter({
                                    text: 'You can retry this operation. If the issue persists, raise a ticket at https://ally.ani.codes/support',
                                }),
                        ],
                    });
                }
            }
        }
    }
};
