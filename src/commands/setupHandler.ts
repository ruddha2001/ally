import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

import { verifyCommandPriviledge } from '../shared/verificationMiddleware.js';
import { ErrorResponses } from './errorResponses.js';
import { getGuildDataByGuildId, updateGuildData } from '../services/guildService.js';
import { parseAllianceLinkInput } from '../shared/discordUtils.js';
import { AllyError, STATIC_ERROR_CODES, throwStaticError } from '../shared/allyError.js';
import { getAllianceById, updateAllianceData } from '../services/allianceService.js';
import { getSingleNationDataByDiscordUsername } from '../services/nationService.js';
import logger from '../lib/logger.js';
import { AllyAllianceInterface, AllyAlliancePositionInterface } from '../@types/alliances.js';
import { AllyGuildDataInterface } from '../@types/guilds.js';
import dayjs from 'dayjs';

export const setupHandler = async (command: ChatInputCommandInteraction) => {
    try {
        await command.deferReply();

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

        const alliancePositions = allianceData?.alliance_positions;

        if (!alliancePositions) {
            logger.warn(
                `[setupHandler] Alliance ${allianceData?.name} has no alliance positions. Continuing alliance setup without permission check.`,
            );
        }

        const leaderIndex = alliancePositions?.length ?? 0;
        const leaderPosition = (alliancePositions as AllyAlliancePositionInterface[])[
            leaderIndex > 0 ? leaderIndex - 1 : 0
        ];

        if (
            leaderPosition.name?.toLowerCase() !== userNationData?.alliance_position?.toLowerCase()
        ) {
            throwStaticError(STATIC_ERROR_CODES.USER_NOT_PRIVILEDGED, 'setupHandler', {
                current_position: userNationData?.alliance_position,
                required_position: leaderPosition.name,
            });
        }

        await updateAllianceData({
            ...(allianceData as AllyAllianceInterface),
            guild_id: guildId as string,
        });

        let updateFlag = false;
        if (await getGuildDataByGuildId(guildId as string)) {
            updateFlag = true;
        }

        const guildData: AllyGuildDataInterface = {
            guild_name: guild?.name as string,
            guild_id: guildId as string,
            managed_channels: {},
            alliance_name: allianceData?.name as string,
            alliance_id: allianceData?.id,
            welcome_channel: welcomeChannel.id,
            verified_role: verifiedRole.id,
            unverified_role: unverifiedRole.id,
            config: {
                dataValidityInMins: 5,
                dateFormat: 'DD MMM YYYY HH:mm:ss',
            },
        };

        await updateGuildData(guildData);

        await command.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Fuchsia')
                    .setTitle(
                        updateFlag
                            ? `Settings have been updated for **${allianceData?.name}**`
                            : `Welcome **${allianceData?.name}** to your new home at **${guild?.name}**`,
                    )
                    .setDescription(
                        `You have ${updateFlag ? 'updated' : 'setup'} your alliance with Ally. ${updateFlag ? 'Continue using' : 'Welcome to'} smarter alliance management!`,
                    )
                    .setFields([
                        {
                            name: 'Alliance Name',
                            value: `[${allianceData?.acronym}] ${allianceData?.name}`,
                        },
                        {
                            name: 'Leader',
                            value: `${userNationData?.leader_name} of ${userNationData?.nation_name}`,
                        },
                    ])
                    .setFooter({
                        text: `${updateFlag ? 'Powered by' : 'Welcome to'} Ally: https://ally.ani.codes`,
                    }),
            ],
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
