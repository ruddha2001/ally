import {
    ActionRowBuilder,
    APIEmbedField,
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    ModalBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { AllyError, STATIC_ERROR_CODES, throwStaticError } from '../shared/allyError.js';
import {
    addAuditLevel,
    addAuditRole,
    getGuildDataByGuildId,
    verifyAdminPermission,
    verifyAuditPermission,
} from '../services/guildService.js';
import { AllyGuildAuditLevel, AllyGuildDataInterface } from '../@types/guilds.js';
import logger from '../lib/logger.js';

const auditShowHandler = async (command: ChatInputCommandInteraction) => {
    const { guildId, guild } = command;

    const guildData = await getGuildDataByGuildId(guildId as string);

    if (!guildData) {
        throwStaticError(STATIC_ERROR_CODES.SERVER_NOT_REGISTERED, 'settingsHandler');
    }

    const { application_settings, alliance_name } = guildData as AllyGuildDataInterface;
    const auditSettings = application_settings?.audit;

    const embedFieldMap: Array<APIEmbedField> | undefined = auditSettings?.audit_mmr_slabs
        ?.map((mmrSlab) => {
            return {
                name: `⚆ ${mmrSlab?.name}`,
                value: `City Range (inclusive): ${mmrSlab?.min_city} to ${mmrSlab?.max_city}
MMR (Barrack/Factory/Hangar/Drydocks): ${mmrSlab?.barracks}/${mmrSlab?.factories}/${mmrSlab?.hangars}/${mmrSlab?.drydocks}`,
            };
        })
        .filter(Boolean);

    await command.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor('Fuchsia')
                .setTitle(`Here are the current Audit Levels set for ${alliance_name}`)
                .setDescription(
                    `Role allowed to update audit settings: ${auditSettings?.audit_role_id ? guild?.roles.cache.get(auditSettings?.audit_role_id) : '**None**\nPlease have an admin add a role with \`/settings audit role\`'}`,
                )
                .setFields(
                    embedFieldMap && embedFieldMap.length !== 0
                        ? embedFieldMap!
                        : [
                              {
                                  name: 'No Levels have been added',
                                  value: 'You can add a new level with \`/settings audit add\` command',
                              },
                          ],
                )
                .setFooter({
                    text: `Powered by Ally: https://ally.ani.codes`,
                }),
        ],
    });
};

const auditRoleHandler = async (command: ChatInputCommandInteraction) => {
    const { user, guildId } = command;

    const isAdmin = await verifyAdminPermission(guildId as string, user.username);
    if (!isAdmin) {
        return throwStaticError(STATIC_ERROR_CODES.USER_NOT_PRIVILEGED, 'auditRoleHandler');
    }

    const auditRole = command.options.getRole('audit_role', true);

    await addAuditRole(guildId as string, auditRole.id);

    await command.editReply({
        embeds: [
            new EmbedBuilder()
                .setColor('Green')
                .setTitle(`You have added an audit role!`)
                .setDescription(
                    `Users with ${auditRole.toString()} can now execute all audit related commands.`,
                )
                .setFooter({
                    text: `Powered by Ally: https://ally.ani.codes`,
                }),
        ],
    });
};

const auditAddHandler = async (command: ChatInputCommandInteraction) => {
    const { member, guildId } = command;
    const isAuditRole = await verifyAuditPermission(guildId as string, member as GuildMember);
    if (!isAuditRole) {
        return throwStaticError(STATIC_ERROR_CODES.NO_AUDIT_ROLE, 'auditAddHandler');
    }

    const modal = new ModalBuilder()
        .setCustomId('newAuditLevelModal')
        .setTitle('Add a new Audit Level');

    const levelNameInput = new TextInputBuilder()
        .setCustomId('levelName')
        .setLabel('What are you naming this Level?')
        .setPlaceholder('Some Crazy Name')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const cityMinInput = new TextInputBuilder()
        .setCustomId('cityMin')
        .setLabel('Lowest City Count for this level (inclusive)')
        .setPlaceholder('0')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const cityMaxInput = new TextInputBuilder()
        .setCustomId('cityMax')
        .setLabel('Highest City Count for this level (inclusive)')
        .setPlaceholder('100')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const mmrInput = new TextInputBuilder()
        .setCustomId('mmrCombined')
        .setLabel('MMR (B F H D) without any spaces or slash')
        .setPlaceholder('1024')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(levelNameInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(cityMinInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(cityMaxInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(mmrInput),
    );

    await command.showModal(modal);

    try {
        const filter = (i: ModalSubmitInteraction) =>
            i.customId === 'newAuditLevelModal' && i.user.id === command.user.id;

        const submission = await command.awaitModalSubmit({ filter, time: 120_000 });

        if (submission) {
            const levelName = submission.fields.getTextInputValue('levelName');
            const cityMin = submission.fields.getTextInputValue('cityMin');
            const cityMax = submission.fields.getTextInputValue('cityMax');
            const mmr = submission.fields.getTextInputValue('mmrCombined');
            const mmrSplit = [...mmr];

            try {
                const levelData: AllyGuildAuditLevel = {
                    name: levelName,
                    max_city: parseInt(cityMax, 10),
                    min_city: parseInt(cityMin, 10),
                    barracks: parseInt(mmrSplit[0], 10),
                    factories: parseInt(mmrSplit[1], 10),
                    hangars: parseInt(mmrSplit[2], 10),
                    drydocks: parseInt(mmrSplit[3], 10),
                };

                await addAuditLevel(guildId as string, levelData);
            } catch (error) {
                logger.debug(error);
                await submission.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('Could not add a new level')
                            .setDescription(
                                'There was an error when I was trying to add a new audit level',
                            ),
                    ],
                });
                return;
            }

            await submission.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Green')
                        .setTitle(`Added a new level: ${levelName}`)
                        .setDescription(
                            'You have successfully added a new level with the following details',
                        )
                        .setFooter({
                            text: `Powered by Ally: https://ally.ani.codes`,
                        }),
                ],
            });
        }
    } catch (err) {
        logger.error(
            `Submission time limit expired for newAuditLevelModal initiated by user ${command.user.displayName} in ${command.guild?.name}`,
        );
    }
};

export const settingsHandler = async (command: ChatInputCommandInteraction) => {
    try {
        const group = command.options.getSubcommandGroup();
        const subcommand = command.options.getSubcommand();

        if (group === 'audit') {
            switch (subcommand) {
                case 'show':
                    await command.deferReply();
                    await auditShowHandler(command);
                    break;
                case 'add':
                    await auditAddHandler(command);
                    break;
                case 'role':
                    await command.deferReply();
                    await auditRoleHandler(command);
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
