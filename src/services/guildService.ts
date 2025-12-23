import { AllyGuildAuditLevel, AllyGuildDataInterface } from '../@types/guilds.js';
import { Database } from '../lib/mongoDbClient.js';

export const updateGuildData = async (guildData: AllyGuildDataInterface) => {
    await (await Database.getDatabase())
        .collection('guilds')
        .updateOne({ guild_id: guildData.guild_id }, { $set: guildData }, { upsert: true });
};

export const getGuildDataByGuildId = async (guildId: string) => {
    return await (await Database.getDatabase())
        .collection('guilds')
        .findOne<AllyGuildDataInterface>({ guild_id: guildId });
};

export const getNationIdFromManagedChannelId = async (
    guildId: string,
    channelId: string,
): Promise<string | null> => {
    const guildData = await getGuildDataByGuildId(guildId);
    if (!guildData || !guildData.managed_channels) return null;
    const { managed_channels } = guildData;
    const channel = managed_channels[channelId];
    if (!channel) return null;

    return channel.nation_id;
};

export const linkChannelId = async (
    guildId: string,
    channelId: string,
    nationId: number,
    channelType?: 'applicant_ticket' | 'support_ticket',
) => {
    const guildData = await getGuildDataByGuildId(guildId);
    if (!guildData) return;

    guildData.managed_channels[channelId] = {
        created_at: new Date(),
        type: channelType ?? 'text_channel',
        nation_id: nationId.toString(),
    };

    await updateGuildData(guildData);
};

export const addAuditLevel = async (guildId: string, levelData: AllyGuildAuditLevel) => {
    const guildData = await getGuildDataByGuildId(guildId);
    if (!guildData) return;

    const { application_settings } = guildData;
    if (!application_settings?.audit) throw Error('NO_AUDIT_DATA');

    const { audit } = application_settings;
    const existingLevel = audit.audit_mmr_slabs.find((level) => level.name === levelData.name);
    if (existingLevel) throw Error('DUPLICATE_NAME');

    if (guildData.application_settings?.audit?.audit_mmr_slabs.length !== 0) {
        guildData.application_settings?.audit?.audit_mmr_slabs.push(levelData);
    } else {
        guildData.application_settings.audit.audit_mmr_slabs = [levelData];
    }

    await updateGuildData(guildData);
};
