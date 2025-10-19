import { ChatInputCommandInteraction } from 'discord.js';
import { ErrorResponses } from './errorResponses.js';
import {
    checkNationVerificationStatus,
    getNationData,
    upsertNationdDataToStorage,
} from '../services/nationService.js';
import logger from '../lib/logger.js';

export const registerHandler = async (command: ChatInputCommandInteraction) => {
    try {
        const { options, user } = command;

        const nationIdOrLink = options.getString('nation_id_or_link', true);

        let nationId: string | null = nationIdOrLink;
        if (nationIdOrLink.startsWith('https')) {
            if (!nationIdOrLink.includes('nation')) {
                return await ErrorResponses.INVALID_NATION_ID(command);
            }
            nationId = nationIdOrLink.split('=')[1] ?? null;
        }

        const numericNationId = Number(nationId);
        if (!nationId || isNaN(numericNationId)) {
            return await ErrorResponses.INVALID_NATION_ID(command);
        }

        const verificationStatus = await checkNationVerificationStatus(numericNationId);
        if (verificationStatus.status) {
            if (!verificationStatus.expired) {
                return await command.reply('You are already verified! Feel free to use Ally!');
            }
        }

        const nationData = await getNationData(numericNationId);
        if (!nationData) {
            return await ErrorResponses.INVALID_NATION_ID(command);
        }

        const { discord } = nationData;

        if (discord !== user.username && discord !== user.tag) {
            console.log(discord, user.username);
            return await ErrorResponses.INVALID_DISCORD_OR_MISMATCH(
                command,
                verificationStatus.expired,
            );
        }

        upsertNationdDataToStorage(numericNationId, nationData);
        await command.reply(`
✅ Congrats **${user.username}** aka **${nationData.leader_name}**!
You have been registered successfully as the leader of the nation **${nationData.nation_name}** 🥷
You can use all Ally services that you have permission for.`);
    } catch (error) {
        logger.error('Unhandled exception in registerHandler', error);
    }
};
