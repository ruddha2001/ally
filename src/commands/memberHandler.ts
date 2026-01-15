import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    GuildMember,
    ModalBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { AllyError, STATIC_ERROR_CODES, throwStaticError } from '../shared/allyError.js';
import {
    addRole,
    getManagedChannelDataFromChannelId,
    RoleManager,
    updateManagedChannelDataByChannelId,
    verifyAdminPermission,
    verifyRole,
} from '../services/guildService.js';
import { AllyManagedChannel } from '../@types/guilds.js';
import { buildDiscordEmbed, EmbedType } from '../shared/discordEmbedBuilder.js';
import { getSingleNationByNationId } from '../services/nationService.js';
import logger from '../lib/logger.js';
import { mapContinentToName } from '../shared/discordUtils.js';

const buildShowHandler = async (command: ChatInputCommandInteraction) => {
    const { guildId, channelId } = command;
    const channelData = await getManagedChannelDataFromChannelId(guildId as string, channelId);

    if (!channelData) {
        throwStaticError(STATIC_ERROR_CODES.TICKET_NOT_LINKED, 'buildShowHandler');
    }

    const { templates, nation_id } = channelData as AllyManagedChannel;
    const nationData = await getSingleNationByNationId(parseInt(nation_id, 10));
    const nationName = nationData?.nation_name;
    const continent = nationData?.continent;
    if (!templates?.build) {
        return await command.editReply({
            embeds: [
                buildDiscordEmbed({
                    type: EmbedType.member,
                    title: `No build template is assigned to this channel for ${nationName} (${mapContinentToName(continent as string)})`,
                    description: `You can assign a build template to this channel by using \`/member build set\` command.`,
                }),
            ],
        });
    }

    await command.editReply({
        embeds: [
            buildDiscordEmbed({
                type: EmbedType.member,
                title: `🏢 Here is the current build assigned to ${nationName}`,
                description: templates.build,
            }),
        ],
    });
};

const buildSetHandler = async (command: ChatInputCommandInteraction) => {
    const { guildId, channelId, member } = command;

    if (!(await verifyRole(guildId as string, member as GuildMember, RoleManager.build))) {
        throwStaticError(STATIC_ERROR_CODES.NO_VALID_ROLE, 'buildSetHandler');
    }

    const channelData = await getManagedChannelDataFromChannelId(guildId as string, channelId);

    if (!channelData) {
        throwStaticError(STATIC_ERROR_CODES.TICKET_NOT_LINKED, 'buildSetHandler');
    }

    const modal = new ModalBuilder()
        .setCustomId('buildTemplateModal')
        .setTitle('Assign a build template');

    const levelNameInput = new TextInputBuilder()
        .setCustomId('templateString')
        .setLabel('Enter the build template')
        .setPlaceholder('JSON Build Template')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(levelNameInput);
    modal.addComponents(actionRow);

    await command.showModal(modal);

    try {
        const filter = (i: ModalSubmitInteraction) =>
            i.customId === 'buildTemplateModal' && i.user.id === command.user.id;

        const submission = await command.awaitModalSubmit({ filter, time: 120_000 });

        if (submission) {
            await submission.deferReply();

            let templateString = submission.fields.getTextInputValue('templateString');
            if (!templateString || templateString.length === 0) {
                return submission.editReply({
                    embeds: [
                        buildDiscordEmbed({
                            type: EmbedType.error,
                            title: `Empty value was passed`,
                            description: `You must enter a valid JSON build template`,
                        }),
                    ],
                });
            }
            try {
                templateString = JSON.stringify(JSON.parse(templateString));
            } catch {
                return submission.editReply({
                    embeds: [
                        buildDiscordEmbed({
                            type: EmbedType.error,
                            title: `Malformed JSON was passed`,
                            description: `You must enter a valid JSON build template`,
                        }),
                    ],
                });
            }

            const { templates, nation_id } = channelData as AllyManagedChannel;
            const nationData = await getSingleNationByNationId(parseInt(nation_id, 10));
            const nationName = nationData?.nation_name;
            const continent = nationData?.continent;
            const isUpdate = Boolean(templates?.build);
            if (channelData?.templates?.build && channelData.templates.build !== templateString) {
                if (channelData?.templates) {
                    channelData.templates.build = templateString;
                } else {
                    channelData!.templates = {
                        build: templateString,
                    };
                }
                await updateManagedChannelDataByChannelId(
                    guildId as string,
                    channelId,
                    channelData as AllyManagedChannel,
                );
            }

            await submission.editReply({
                embeds: [
                    buildDiscordEmbed({
                        type: EmbedType.member,
                        title: `✅ Build has been ${isUpdate ? 'updated' : 'set'} for ${nationName} ${mapContinentToName(continent as string)})`,
                        description: templateString,
                    }),
                ],
            });
        }
    } catch (err) {
        logger.error(
            `Submission time limit expired for buildTemplateModal initiated by user ${command.user.displayName} in ${command.guild?.name}`,
        );
    }
};

const buildRoleHandler = async (command: ChatInputCommandInteraction) => {
    const { user, guildId } = command;

    const isAdmin = await verifyAdminPermission(guildId as string, user.username);
    if (!isAdmin) {
        return throwStaticError(STATIC_ERROR_CODES.USER_NOT_PRIVILEGED, 'buildRoleHandler');
    }

    const buildRole = command.options.getRole('build_role', true);

    await addRole(guildId as string, buildRole.id, RoleManager.build);

    await command.editReply({
        embeds: [
            buildDiscordEmbed({
                type: EmbedType.member,
                title: `Build role has been set!`,
                description: `Users with ${buildRole.toString()} can now assign build templates to members.`,
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
                case 'set':
                    await buildSetHandler(command);
                    return;
                case 'role':
                    await command.deferReply();
                    await buildRoleHandler(command);
                    break;
                default:
                    throw Error();
            }
        }
    } catch (error) {
        console.error(error);
        if (error instanceof AllyError) {
            throw error;
        } else {
            throw new AllyError('Encountered unexpected error', 'memberHandler');
        }
    }
};
