import { ChatInputCommandInteraction } from 'discord.js';

import { getGuildDataFromGuildId, upsertGuildToStorage } from '../services/guildService.js';
import { ErrorResponses } from './errorResponses.js';
import { GuildDataInterface } from '../@types/guilds.js';
import logger from '../lib/logger.js';

export const applicantSettingsHandler = async (command: ChatInputCommandInteraction) => {
    try {
        const { guildId, options } = command;

        const iaRole = options.getRole('ia_role', true);
        const memberRole = options.getRole('member_role', false);
        const applicantCategory = options.getChannel('applicant_category', false);

        const guildData = await getGuildDataFromGuildId(guildId as string);

        if (!guildData) {
            return await ErrorResponses.NOT_REGISTERED_ALLIANCE(command);
        }

        const updatedGuildData: GuildDataInterface = {
            ...guildData,
            application_settings: {
                ia_role: iaRole.id,
                ...(memberRole && { membership_role: memberRole?.id }),
                ...(applicantCategory && { application_category_id: applicantCategory.id }),
            },
        };

        await upsertGuildToStorage(updatedGuildData);

        await command.reply(`
You have successfully updated the settings for my New Applicant Management feature.
For new applicants in this server, I will start to:
1. Make a ticket under the applicant_category (if supplied) for every new applicant.
2. Ping IA Staff once the applicant is registered and ready to be processed.
3. [Future Plan] Guide them and track them to apply in-game.
3. [Future Plan] You can promote members with \`/promote_member\` command and I will add the membership role + promote them in-game.`);
    } catch (error) {
        logger.error(`Unexpected error in applicantSettingsHandler`, error);
        await ErrorResponses.UNEXPECTED_EXCEPTION(command);
    }
};
