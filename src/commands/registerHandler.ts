import { ChatInputCommandInteraction, Guild } from 'discord.js';
import { ErrorResponses } from './errorResponses.js';
import {
    checkNationVerificationStatus,
    getNationData,
    upsertNationdDataToStorage,
} from '../services/nationService.js';
import logger from '../lib/logger.js';
import { markApplicantChannelAsVerified } from '../services/channelService.js';

export const registerHandler = async (command: ChatInputCommandInteraction) => {
    try {
        const { options, user, guild } = command;

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

        const verificationStatus = await checkNationVerificationStatus({
            nation_id: numericNationId,
        });
        const nationData = await getNationData(numericNationId);
        if (verificationStatus.status) {
            if (!verificationStatus.expired) {
                if (nationData && nationData.nation_name) {
                    markApplicantChannelAsVerified(
                        guild as Guild,
                        `❌ ${user.displayName}`,
                        nationData.nation_name,
                    );
                }
                return await command.reply('You are already verified! Feel free to use Ally!');
            }
        }

        if (!nationData) {
            return await ErrorResponses.INVALID_NATION_ID(command);
        }

        const { discord } = nationData;

        if (discord !== user.username && discord !== user.tag) {
            return await ErrorResponses.INVALID_DISCORD_OR_MISMATCH(
                command,
                verificationStatus.expired,
            );
        }

        // Handle expired verifications
        // if (verificationStatus.expired) {
        //     return await command.reply(
        //         'You are already verified (I checked just now)! Feel free to use Ally!',
        //     );
        // }

        upsertNationdDataToStorage(numericNationId, nationData, user.username);
        await command.reply(`
✅ Congrats **${user.username}** aka **${nationData.leader_name}**!
You have been registered successfully as the leader of the nation **${nationData.nation_name}** 🥷
You can use all Ally services that you have permission for.`);
        markApplicantChannelAsVerified(
            guild as Guild,
            `❌ ${user.displayName}`,
            nationData.nation_name as string,
        );
    } catch (error) {
        logger.error('Unhandled exception in registerHandler', error);
    }
};
