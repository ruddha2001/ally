import { ButtonInteraction, ChannelType, PermissionsBitField } from 'discord.js';

import { getGuildDataByGuildId } from '../services/guildService.js';
import logger from '../lib/logger.js';
import { ErrorResponses } from '../commands/errorResponses.js';

export const applyForAllianceHandler = async (command: ButtonInteraction) => {
    try {
        await command.deferReply({ ephemeral: true });
        const { user, guildId, guild } = command;

        const guildData = await getGuildDataByGuildId(guildId as string);

        if (!guild || !guildData || !guildData.application_settings) {
            // Silently ignore
            return;
        }

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
        await command.editReply({
            content:
                'You have been assigned your new ticket, please check and follow the instructions there. Welcome aboard!',
        });
    } catch (error) {
        logger.error('Unexpected error in applyForAllianceHandler', error);
        if (command.replied) {
            await command.editReply({
                content: '❌ An error occurred while processing your request. Please try again.',
            });
        }
    }
};
