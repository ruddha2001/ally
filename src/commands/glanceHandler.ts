import { ChatInputCommandInteraction } from 'discord.js';
import { AllyError, STATIC_ERROR_CODES, throwStaticError } from '../shared/allyError.js';
import { getGuildDataFromGuildId } from '../services/guildService.js';
import { parseNationLinkInput } from '../shared/discordUtils.js';

export const glanceHandler = async (command: ChatInputCommandInteraction) => {
    try {
        const { guildId, options, user } = command;

        const guildData = await getGuildDataFromGuildId(guildId as string);

        if (!guildData) {
            throwStaticError(STATIC_ERROR_CODES.SERVER_NOT_REGISTERED, 'glanceHandler');
        }

        const nation_id_or_link = options.getString('nation_id_or_link', false);
        const nationId = parseNationLinkInput(nation_id_or_link);

        if (!nationId) {
            throwStaticError(STATIC_ERROR_CODES.INVALID_NATION_ID, 'glanceHandler', {
                nation_id_or_link,
            });
        }
    } catch (error) {
        if (error instanceof AllyError) {
            throw error;
        } else {
            throw new AllyError('Encountered unexpected error', 'glanceHandler');
        }
    }
};
