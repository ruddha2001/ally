import { ButtonInteraction, ChannelType, PermissionsBitField } from 'discord.js';

import { getGuildDataByGuildId } from '../services/guildService.js';
import logger from '../lib/logger.js';

export const applyForAllianceHandler = async (command: ButtonInteraction) => {
    try {
        const { user, guildId, guild } = command;

        const guildData = await getGuildDataByGuildId(guildId as string);

        await command.deferUpdate();

        if (command.message.editable) {
            await command.message.edit({
                content:
                    !guild || !guildData || !guildData.application_settings
                        ? 'This server is not configured for accepting new members.'
                        : `Just a second ${user.username}, creating your ticket.`,
                components: [],
            });
        } else {
            logger.warn('Button message is not editable; cannot remove components.');
        }

        if (!guild || !guildData || !guildData.application_settings) return;

        const { application_settings } = guildData;

        const { ViewChannel, SendMessages, ReadMessageHistory } = PermissionsBitField.Flags;
        const newChannel = await guild.channels.create({
            name: `❌ ${user.displayName}`,
            type: ChannelType.GuildText,
            ...(application_settings.application_category_id && {
                parent: application_settings.application_category_id,
            }),

            permissionOverwrites: [
                {
                    id: user.id,
                    allow: [ViewChannel, SendMessages, ReadMessageHistory],
                },
                {
                    id: guild.client.user.id,
                    allow: [ViewChannel, SendMessages],
                },
            ],
        });
        logger.debug(`New applicant ticket created: ${newChannel.name}`);

        await newChannel.send({
            content: `
Hi ${user}.
This is your applicant ticket. We will be using this chat to help you get registered and join in as a member.

To begin, please use \`/register\` command with your nation ID/link.
You can get your nation ID by logging into PnW, and click on Nation->View from the menu. You will see your Nation ID under Basic Information.`,
        });
        await command.followUp({
            ephemeral: true,
            content:
                'You have been assigned your new ticket, please check and follow the instructions there. Welcome aboard!',
        });
    } catch (error) {
        logger.error('Unexpected error in applyForAllianceHandler', error);
        if (command.deferred || command.replied) {
            await command
                .editReply({ content: 'An error occurred. Please try again.' })
                .catch(() => {});
        } else {
            await command
                .reply({ ephemeral: true, content: 'An error occurred. Please try again.' })
                .catch(() => {});
        }
    }
};
