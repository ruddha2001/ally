import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

import {
    getGuildDataByGuildId,
    updateGuildData,
    verifyAdminPermission,
} from '../services/guildService.js';
import { parseAllianceLinkInput } from '../shared/discordUtils.js';
import { AllyError, STATIC_ERROR_CODES, throwStaticError } from '../shared/allyError.js';
import { getAllianceById, updateAllianceData } from '../services/allianceService.js';
import { getSingleNationDataByDiscordUsername } from '../services/nationService.js';
import logger from '../lib/logger.js';
import { AllyAllianceInterface, AllyAlliancePositionInterface } from '../@types/alliances.js';
import { AllyGuildDataInterface } from '../@types/guilds.js';

/**
 * @deprecated This command handler is deprecated and may be removed in a future release. Prefer the newer guild/alliance setup flow using /settings.
 *
 * @summary Handles the `/setup` command for initial guild configuration and alliance association.
 *
 * @description
 * Defers the interaction reply, validates the invoking user is registered, parses and validates the provided
 * alliance ID/link, associates the alliance with the current Discord guild, and persists guild configuration
 * (welcome channel and verification roles). Responds with an embed indicating whether settings were created
 * or updated.
 *
 * The handler also attempts to validate administrative privileges for the invoking user and records them
 * as an admin for the guild configuration.
 *
 * @param command - The Discord chat input command interaction containing options:
 * `alliance_id_or_link`, `welcome_channel`, `unverified_role`, and `registered_role`.
 *
 * @returns A promise that resolves when the interaction reply has been edited with the result embed.
 *
 * @throws {AllyError}
 * Thrown for known error conditions (e.g., user not registered, invalid alliance ID, insufficient privileges).
 * Unknown errors are wrapped in an {@link AllyError}.
 */
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

        if (!(await verifyAdminPermission(guildId as string, user.username))) {
            throwStaticError(STATIC_ERROR_CODES.USER_NOT_PRIVILEGED, 'setupHandler');
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
            admins: [user.username],
            application_settings: {},
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
