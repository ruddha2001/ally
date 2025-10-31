import { GuildDataInterface } from '../@types/guilds.js';
import { Database } from '../lib/mongoDbClient.js';

export const upsertGuildToStorage = async (guildData: GuildDataInterface) => {
    await (await Database.getDatabse())
        .collection('guilds')
        .updateOne({ guild_id: guildData.guild_id }, { $set: guildData }, { upsert: true });
};

export const getGuildDataFromGuildId = async (guildId: string) => {
    return await (await Database.getDatabse())
        .collection('guilds')
        .findOne<GuildDataInterface>({ guild_id: guildId });
};

export const storeChannelId = async (
    guildId: string,
    channelId: string,
    nationId: number,
    channelType?: 'applicant_ticket' | 'support_ticket',
) => {
    const guildData = await getGuildDataFromGuildId(guildId);
    if (!guildData) return;

    guildData.managed_channels[channelId] = {
        created_at: new Date(),
        type: channelType ?? 'text_channel',
        nation_id: nationId.toString(),
    };

    await upsertGuildToStorage(guildData);

    await upsertGuildToStorage(guildData);
};
