import { APIEmbedField, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { AllyError, STATIC_ERROR_CODES, throwStaticError } from '../shared/allyError.js';
import { getGuildDataByGuildId } from '../services/guildService.js';
import { AllyGuildDataInterface } from '../@types/guilds.js';

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

export const settingsHandler = async (command: ChatInputCommandInteraction) => {
    try {
        await command.deferReply();
        const group = command.options.getSubcommandGroup();
        const subcommand = command.options.getSubcommand();

        if (group === 'audit') {
            switch (subcommand) {
                case 'show':
                    await auditShowHandler(command);
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
