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
