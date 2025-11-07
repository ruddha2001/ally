import { ChatInputCommandInteraction, EmbedBuilder, Guild, GuildMember } from 'discord.js';
import { getSingleNationByNationId } from '../services/nationService.js';
import { markApplicantChannelAsVerified } from '../services/channelService.js';
import { parseNationLinkInput } from '../shared/discordUtils.js';
import { throwStaticError, STATIC_ERROR_CODES, AllyError } from '../shared/allyError.js';
import { AllyNationInterface } from '../@types/nations.js';
import { linkChannelId } from '../services/guildService.js';

export const registerHandler = async (command: ChatInputCommandInteraction) => {
    try {
        await command.deferReply();

        const { options, user, guild, guildId, channelId } = command;

        const nationIdOrLink = options.getString('nation_id_or_link', true);

        const numericNationId = parseNationLinkInput(nationIdOrLink);
        if (!numericNationId || isNaN(numericNationId)) {
            throwStaticError(STATIC_ERROR_CODES.INVALID_NATION_ID, 'registerHandler', {
                nation_id_or_link: nationIdOrLink,
            });
        }

        let nationData = await getSingleNationByNationId(
            numericNationId as number,
            undefined,
            true,
        );

        if (!nationData) {
            throwStaticError(STATIC_ERROR_CODES.INVALID_NATION_ID, 'registerHandler', {
                nation_id_or_link: nationIdOrLink,
            });
        }

        nationData = nationData as AllyNationInterface;

        const { id, discord } = nationData;

        if (discord !== user.username) {
            throwStaticError(STATIC_ERROR_CODES.INVALID_DISCORD, 'registerHandler', {
                nation_discord: discord,
                username: user.username,
            });
        }

        await linkChannelId(guildId as string, channelId, id as number, 'applicant_ticket');

        markApplicantChannelAsVerified(
            guild as Guild,
            (await guild?.members.fetch(user.id)) as GuildMember,
            `❌ ${user.displayName}`,
            nationData.nation_name as string,
        );

        await command.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('DarkGreen')
                    .setTitle(
                        `✅ Congratulations **${user.username}** aka **${nationData.leader_name}**`,
                    )
                    .setDescription(
                        `You have been registered successfully as the leader of the nation **${nationData.nation_name}** 🥷
This channel has been linked as your applicant ticket.`,
                    )
                    .setFooter({
                        text: `Powered by Ally: https://ally.ani.codes`,
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
