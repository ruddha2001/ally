import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import dayjs from 'dayjs';

import { AllyError, STATIC_ERROR_CODES, throwStaticError } from '../shared/allyError.js';
import { getGuildDataFromGuildId } from '../services/guildService.js';
import { dayDiff, getColorCircleEmoji, parseNationLinkInput } from '../shared/discordUtils.js';
import { getSingleNationByNationId } from '../services/nationService.js';
import { GuildDataInterface } from '../@types/guilds.js';

const getNationIdFromChannelId = (
    channelId: string,
    guildData: GuildDataInterface,
): number | null => {
    if (Object.keys(guildData.managed_channels ?? {}).includes(channelId)) {
        const { nation_id } = guildData.managed_channels[channelId];
        return Number(nation_id);
    }
    return null;
};

export const glanceHandler = async (command: ChatInputCommandInteraction) => {
    try {
        const { guildId, options, user } = command;

        const guildData = await getGuildDataFromGuildId(guildId as string);

        if (!guildData) {
            throwStaticError(STATIC_ERROR_CODES.SERVER_NOT_REGISTERED, 'glanceHandler');
        }

        const show_everyone = options.getBoolean('show_result_to_everyone', false) ?? false;
        const nation_id_or_link = options.getString('nation_id_or_link', false);
        const nationId =
            getNationIdFromChannelId(
                command.channel?.id as string,
                guildData as GuildDataInterface,
            ) ?? parseNationLinkInput(nation_id_or_link);

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

        await command.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Blurple')
                    .setTitle(`Here is a summary for **${userNationData?.nation_name}**`)
                    .setDescription(
                        `🔗 Nation Link: https://politicsandwar.com/nation/id=${nationId}
🎨 Color Bloc: ${getColorCircleEmoji(userNationData?.color_block ?? '') ?? userNationData?.color_block}
🕕 Last Active: ${lastActiveDayJs.format(guildData?.config.dateFormat)} [${dayDiff(lastActiveDayJs)} ago]

🏢 MMR: Not Available
🪖 Militarisation: Not Available
🕵️ Spies: ${userNationData?.spies}

🌆 Number of Cities: ${userNationData?.num_cities}
🏗️ Average Infrastructure: ${averageInfra}`,
                    )
                    .setFooter({
                        text: `Stats by Ally: https://ally.ani.codes
Data was last updated at ${dayjs(userNationData?.ally_last_updated).format(guildData?.config.dateFormat)}`,
                    }),
            ],
            flags: show_everyone ? [] : [MessageFlags.Ephemeral],
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
