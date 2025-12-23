import {
    ActionRowBuilder,
    APIEmbedField,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
    ModalBuilder,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { AllyError, STATIC_ERROR_CODES, throwStaticError } from '../shared/allyError.js';
import { getGuildDataByGuildId } from '../services/guildService.js';
import { AllyGuildDataInterface } from '../@types/guilds.js';
import logger from '../lib/logger.js';

const auditShowHandler = async (command: ChatInputCommandInteraction) => {
    const { guildId, guild } = command;

    const guildData = await getGuildDataByGuildId(guildId as string);

    if (!guildData) {
        throwStaticError(STATIC_ERROR_CODES.SERVER_NOT_REGISTERED, 'settingsHandler');
    }

    const { application_settings, alliance_name } = guildData as AllyGuildDataInterface;
    const auditSettings = application_settings?.audit;

    const embedFieldMap: Array<APIEmbedField> | undefined = auditSettings?.audit_levels
        ?.map((level: string) => {
            const mmrSlab = auditSettings.audit_mmr_slabs.find((slab) => slab.level === level);
            return {
                name: `⚆ ${mmrSlab?.name}`,
                value: `ID: ${mmrSlab?.level}
City Range (inclusive): ${mmrSlab?.min_city} to ${mmrSlab?.max_city}
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
                    `Role allowed to update audit settings: ${auditSettings?.audit_role_id ? guild?.roles.cache.get(auditSettings?.audit_role_id) : '**None**\nPlease have the leader add a role with \`/settings audit role\`'}`,
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

const auditAddHandler = async (command: ChatInputCommandInteraction) => {
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

            await submission.reply({
                content: `✅ A new level named ${levelName} has been added.`,
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
            }
        }
    } catch (error) {
        console.error(error);
        if (error instanceof AllyError) {
            throw error;
        } else {
            throw new AllyError('Encountered unexpected error', 'glanceHandler');
        }
    }
};
