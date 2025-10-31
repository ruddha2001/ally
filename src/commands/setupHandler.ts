import { ChatInputCommandInteraction } from 'discord.js';

import { verifyCommandPriviledge } from '../shared/verificationMiddleware.js';
import { ErrorResponses } from './errorResponses.js';
import { upsertGuildToStorage } from '../services/guildService.js';
import { parseAllianceLinkInput } from '../shared/discordUtils.js';
import { AllyError, STATIC_ERROR_CODES, throwStaticError } from '../shared/allyError.js';
import { getAllianceById } from '../services/allianceService.js';
import { getSingleNationDataByDiscordUsername } from '../services/nationService.js';

export const setupHandler = async (command: ChatInputCommandInteraction) => {
    try {
        const { guild, guildId, options, user } = command;

        const alliance_id_or_link = options.getString('alliance_id_or_link', true);
        const welcomeChannel = options.getChannel('welcome_channel', true);
        const unverifiedRole = options.getRole('unverified_role', true);
        const verifiedRole = options.getRole('registered_role', true);

        const userNationData = await getSingleNationDataByDiscordUsername(user.username);

        if (!userNationData) {
            throwStaticError(STATIC_ERROR_CODES.USER_NOT_REGISTERED, 'setupHandler');
        }

        const allianceId = parseAllianceLinkInput(alliance_id_or_link);

        if (!allianceId) {
            throwStaticError(STATIC_ERROR_CODES.INVALID_ALLIANCE_ID, 'setupHandler', {
                alliance_id_or_link,
            });
        }

        const allianceData = await getAllianceById(allianceId!.toString());

        console.log(allianceData);

        const nationData = await verifyCommandPriviledge(
            command,
            {
                discordUsername: user.username,
            },
            process.env.NODE_ENV === 'development' ? 'MEMBER' : 'LEADER',
        );

        // TODO: Handle this gracefully
        if (!nationData) return;

        if (allianceId?.toString() !== nationData?.alliance.id) {
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
            managed_channels: {},
            config: {
                dataValidityInMins: 5,
                dateFormat: 'DD MMM YYYY HH:mm:ss',
            },
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
        console.error(error);
        if (error instanceof AllyError) {
            throw error;
        } else {
            throw new AllyError('Encountered unexpected error', 'glanceHandler');
        }
    }
};
