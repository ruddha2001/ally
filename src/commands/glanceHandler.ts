import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import dayjs from 'dayjs';

import { AllyError, STATIC_ERROR_CODES, throwStaticError } from '../shared/allyError.js';
import {
    getGuildDataByGuildId,
    getNationIdFromManagedChannelId,
} from '../services/guildService.js';
import {
    dayDiff,
    getColorCircleEmoji,
    mapContinentToName,
    parseNationLinkInput,
} from '../shared/discordUtils.js';
import { getSingleNationByNationId } from '../services/nationService.js';

export const glanceHandler = async (command: ChatInputCommandInteraction) => {
    try {
        const { guildId, options } = command;
        const show_everyone = options.getBoolean('show_result_to_everyone', false) ?? false;
        await command.deferReply({ flags: show_everyone ? [] : [MessageFlags.Ephemeral] });

        const guildData = await getGuildDataByGuildId(guildId as string);

        if (!guildData) {
            throwStaticError(STATIC_ERROR_CODES.SERVER_NOT_REGISTERED, 'glanceHandler');
        }

        const nation_id_or_link = options.getString('nation_id_or_link', false);
        const nationIdFromManagedChannel = await getNationIdFromManagedChannelId(
            guildId as string,
            command.channelId as string,
        );
        const nationId = parseNationLinkInput(nationIdFromManagedChannel ?? nation_id_or_link);

        if (!nationId) {
            throwStaticError(STATIC_ERROR_CODES.INVALID_NATION_ID, 'glanceHandler', {
                nation_id_or_link,
            });
        }

        const userNationData = await getSingleNationByNationId(
            nationId as number,
            guildData?.config?.dataValidityInMins,
        );
        const totalInfra = userNationData?.cities?.reduce(
            (memo, city) => memo + (city.infrastructure ?? 0),
            0,
        );
        const averageInfra = (totalInfra ?? 0) / (userNationData?.num_cities ?? 1);
        const lastActiveDayJs = dayjs(userNationData?.last_active as string);

        await command.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Blurple')
                    .setTitle(`Here is a summary for **${userNationData?.nation_name}**`)
                    .setDescription(
                        `Leader: ${userNationData?.leader_name} [Discord: ${userNationData?.discord}]`,
                    )
                    .setFields([
                        {
                            name: '📰 **General Details** 📰',
                            value: `🔗 Nation Link: https://politicsandwar.com/nation/id=${nationId}
🎨 Color Bloc: ${getColorCircleEmoji(userNationData?.color_block ?? '') ?? userNationData?.color_block}
🚜 Continent: ${mapContinentToName(userNationData?.continent as string) ?? `Out Of the World? [${userNationData?.continent}]`}
🕕 Last Active: ${lastActiveDayJs.format(guildData?.config.dateFormat)} [${dayDiff(lastActiveDayJs)} ago]`,
                        },
                        {
                            name: '🏢 **City Zoning Commission** 🏢',
                            value: `🌆 Number of Cities: ${userNationData?.num_cities}
🏗️ Average Infrastructure: ${averageInfra}
🥊 MMR (Barracks/Factories/Hangars/Drydocks): ${userNationData?.min_mil_req?.totalBarracks}/${userNationData?.min_mil_req?.totalFactories}/${userNationData?.min_mil_req?.totalHangars}/${userNationData?.min_mil_req?.totalDrydocks}`,
                        },
                        {
                            name: `⚔️ **Millitary Zone** ⚔️`,
                            value: `🪖 Soldiers: ${userNationData?.millitary?.soldiers ?? 0} out of ${userNationData?.millitary?.max_soldiers ?? 0}
💣 Tanks: ${userNationData?.millitary?.tanks ?? 0} out of ${userNationData?.millitary?.max_tanks ?? 0}
🛩️ Aircrafts: ${userNationData?.millitary?.aircrafts ?? 0} out of ${userNationData?.millitary?.max_aircrafts ?? 0}
🚢 Ships: ${userNationData?.millitary?.ships ?? 0} out of ${userNationData?.millitary?.max_ships ?? 0}
🚀 Missiles: ${userNationData?.millitary?.missiles ?? 0} out of ${userNationData?.millitary?.max_missiles ?? 0}
☢️ Nukes: ${userNationData?.millitary?.nukes ?? 0} out of ${userNationData?.millitary?.max_nukes ?? 0}
🕵️ Spies: ${userNationData?.millitary?.spies ?? 0} out of ${userNationData?.millitary?.max_spies ?? 0}`,
                        },
                    ])
                    .setFooter({
                        text: `Stats by Ally: https://ally.ani.codes
Data was last updated at ${dayjs(userNationData?.ally_last_updated).format(guildData?.config.dateFormat)}`,
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
