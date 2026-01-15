import { ChatInputCommandInteraction } from 'discord.js';
import { AllyError, STATIC_ERROR_CODES, throwStaticError } from '../shared/allyError.js';
import { getManagedChannelDataFromChannelId } from '../services/guildService.js';
import { AllyManagedChannel } from '../@types/guilds.js';
import { buildDiscordEmbed, EmbedType } from '../shared/discordEmbedBuilder.js';
import { getSingleNationByNationId } from '../services/nationService.js';

const buildShowHandler = async (command: ChatInputCommandInteraction) => {
    const { guildId, channelId } = command;
    const channelData = await getManagedChannelDataFromChannelId(guildId as string, channelId);

    if (!channelData) {
        throwStaticError(STATIC_ERROR_CODES.TICKET_NOT_LINKED, 'buildShowHandler');
    }

    const { templates, nation_id } = channelData as AllyManagedChannel;
    const nationData = await getSingleNationByNationId(parseInt(nation_id, 10));
    const nationName = nationData?.nation_name;
    if (!templates?.build) {
        return await command.editReply({
            embeds: [
                buildDiscordEmbed({
                    type: EmbedType.member,
                    title: `No build template is assigned to this channel${nationName && ` belonging to ${nationName}`}`,
                    description: `You can assign a build template to this channel by using \`/member build set\` command.`,
                }),
            ],
        });
    }

    await command.editReply({
        embeds: [
            buildDiscordEmbed({
                type: EmbedType.member,
                title: `🏢 Here is the current build${nationName && ` assigned to ${nationName}`}`,
                description: templates.build,
            }),
        ],
    });
};

export const memberHandler = async (command: ChatInputCommandInteraction) => {
    try {
        const group = command.options.getSubcommandGroup();
        const subcommand = command.options.getSubcommand();

        if (group === 'build') {
            switch (subcommand) {
                case 'show':
                    await command.deferReply();
                    await buildShowHandler(command);
                    break;
            }
        }
    } catch (error) {
        console.error(error);
        if (error instanceof AllyError) {
            throw error;
        } else {
            throw new AllyError('Encountered unexpected error', 'settingsHandler');
        }
    }
};
