import { ChatInputCommandInteraction } from 'discord.js';

import logger from '../lib/logger.js';
import { verifyCommandPriviledge } from '../shared/verificationMiddleware.js';
import { ErrorResponses } from './errorResponses.js';
import { upsertGuildToStorage } from '../services/guildService.js';

export const setupHandler = async (command: ChatInputCommandInteraction) => {
    try {
        const { guild, guildId, commandName, options, user } = command;

        logger.debug(
            `Received command: /${commandName} from ${command.user.tag} in Guild: ${guild} (${guildId})`,
        );

        const allianceIdOrLink = options.getString('alliance_id_or_link', true);
        const welcomeChannel = options.getChannel('welcome_channel', true);
        const unverifiedRole = options.getRole('unverified_role', true);
        const verifiedRole = options.getRole('registered_role', true);

        let allianceId: string | null = allianceIdOrLink;
        if (allianceIdOrLink.startsWith('https')) {
            if (!allianceIdOrLink.includes('alliance')) {
                return await ErrorResponses.INVALID_NATION_ID(command);
            }
            allianceId = allianceIdOrLink.split('=')[1] ?? null;
        }

        const numericAllianceId = Number(allianceId);
        if (!allianceId || isNaN(numericAllianceId)) {
            return await ErrorResponses.INVALID_ALLIANCE_ID(command);
        }

        const nationData = await verifyCommandPriviledge(
            command,
            {
                discordUsername: user.username,
            },
            process.env.NODE_ENV === 'development' ? 'MEMBER' : 'LEADER',
        );

        if (!nationData) return;

        if (allianceId !== nationData?.alliance.id) {
            return await ErrorResponses.NOT_IN_ALLIANCE(command);
        }

        await upsertGuildToStorage({
            guild_id: guildId as string,
            guild_name: guild?.name as string,
            welcome_channel: welcomeChannel.id as string,
            alliance_id: nationData.alliance.id,
            alliance_name: nationData.alliance.name,
            verified_role: verifiedRole.id,
            unverified_role: unverifiedRole.id,
        });

        await command.reply(`
Ahoy Leader **${user.username}**!
You have successfully linked your alliance **${nationData.alliance.name}** with Ally!
You can use all Ally services in this server. To use Ally for your alliance outside of this server, please run \`/setup\` in the new server.`);
        // TODO add check for application settings
        await command.followUp({
            content: `
I can see that you have NOT enabled new applicant management feature of mine. I can help you process new members with ease.
Please run \'/applicant_settings\' and follow the instructions to enable this feature`,
        });
    } catch (error) {
        logger.error('Unexpected error in setupHandler', error);
        await ErrorResponses.UNEXPECTED_EXCEPTION(command);
    }
};
