import { CACHE_KEYS } from '../../constants.js';
import { AllyGuildAuditLevel, AllyGuildDataInterface } from '../@types/guilds.js';
import { Cache } from '../lib/cache.js';
import { Database } from '../lib/mongoDbClient.js';
import type { Document } from 'mongodb';
import { STATIC_ERROR_CODES, throwStaticError } from '../shared/allyError.js';

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
    if (!guildData) throwStaticError(STATIC_ERROR_CODES.SERVER_NOT_REGISTERED, 'addAuditLevel');

    const { application_settings } = guildData as AllyGuildDataInterface;
    if (!application_settings?.audit) throw Error('NO_AUDIT_DATA');

    const { audit } = application_settings;
    const existingLevel = audit.audit_mmr_slabs.find((level) => level.name === levelData.name);
    if (existingLevel) throw Error('DUPLICATE_NAME');

    if (guildData?.application_settings?.audit?.audit_mmr_slabs.length !== 0) {
        guildData?.application_settings?.audit?.audit_mmr_slabs.push(levelData);
    } else {
        guildData.application_settings.audit.audit_mmr_slabs = [levelData];
    }

    await updateGuildData(guildData as AllyGuildDataInterface);
};

export const addAuditRole = async (guildId: string, roleId: string) => {
    const guildData = await getGuildDataByGuildId(guildId);
    if (!guildData) throwStaticError(STATIC_ERROR_CODES.SERVER_NOT_REGISTERED, 'addAuditRole');

    const { application_settings } = guildData as AllyGuildDataInterface;
    if (!application_settings?.audit) throw Error('NO_AUDIT_DATA');

    if (guildData?.application_settings?.audit) {
        guildData.application_settings.audit.audit_role_id = roleId;
    }

    await updateGuildData(guildData as AllyGuildDataInterface);
};

export const getAllAllianceIds = async (): Promise<number[]> => {
    const keys = await Cache.getCache().get<number[]>(CACHE_KEYS.ALL_ALLIANCE_IDS);
    if (keys) {
        return keys;
    }

    const allianceIds: string[] = await (await Database.getDatabase())
        .collection('guilds')
        .distinct('alliance_id', {
            alliance_id: { $exists: true, $ne: null },
        });

    await Cache.getCache().set(CACHE_KEYS.ALL_ALLIANCE_IDS, allianceIds, 1 * 60 * 60 * 1000);

    return allianceIds.map((id) => parseInt(id, 10));
};

export const getAllNationIds = async (): Promise<number[]> => {
    const keys = await Cache.getCache().get<number[]>(CACHE_KEYS.ALL_NATION_IDS);
    if (keys) {
        return keys;
    }

    const pipeline = [
        {
            $project: {
                managed: { $objectToArray: '$managed_channels' },
            },
        },
        { $unwind: '$managed' },
        {
            $match: {
                'managed.v.nation_id': { $exists: true, $ne: null },
            },
        },
        {
            $group: {
                _id: null,
                nation_ids: { $addToSet: '$managed.v.nation_id' },
            },
        },
        { $project: { _id: 0, nation_ids: 1 } },
    ];

    const nationIds = await (await Database.getDatabase())
        .collection('guilds')
        .aggregate<{ nation_ids: string[] }>(pipeline)
        .toArray();

    const transformedNationIds = nationIds.reduce((memo: number[], obj) => {
        obj.nation_ids.forEach((id) => {
            memo.push(parseInt(id, 10));
        });
        return memo;
    }, []);

    await Cache.getCache().set(CACHE_KEYS.ALL_NATION_IDS, transformedNationIds, 1 * 60 * 60 * 1000);

    return transformedNationIds;
};

export const getGuildIdAndManagedChannelKeyByNationId = async (
    nationId: string | number,
): Promise<{
    guild_id: string;
    managed_channel_keys: string[];
} | null> => {
    const nationIdStr = String(nationId);

    const cacheKey = `${CACHE_KEYS.GUILD_BY_MANAGED_NATION_ID}:${nationIdStr}`;
    const cached = await Cache.getCache().get<{
        guild_id: string;
        managed_channel_keys: string[];
    } | null>(cacheKey);
    if (cached) return cached;

    const db = await Database.getDatabase();

    const pipeline: Document[] = [
        { $match: { managed_channels: { $type: 'object' } } },
        {
            $project: {
                _id: 0,
                guild_id: 1,
                entries: { $objectToArray: '$managed_channels' },
            },
        },
        {
            $project: {
                guild_id: 1,
                matches: {
                    $filter: {
                        input: '$entries',
                        as: 'e',
                        cond: { $eq: ['$$e.v.nation_id', nationIdStr] },
                    },
                },
            },
        },
        { $match: { $expr: { $gt: [{ $size: '$matches' }, 0] } } },
        {
            $project: {
                guild_id: 1,
                managed_channel_keys: {
                    $map: { input: '$matches', as: 'm', in: '$$m.k' },
                },
            },
        },
        { $limit: 1 },
    ];

    const result = await db
        .collection('guilds')
        .aggregate<{ guild_id: string; managed_channel_keys: string[] }>(pipeline)
        .toArray();

    const lookup = result[0] ?? null;

    await Cache.getCache().set(cacheKey, lookup, 10 * 60 * 1000);
    return lookup;
};

export const verifyAdminPermission = async (
    guildId: string,
    username: string,
): Promise<boolean> => {
    const guildData = await getGuildDataByGuildId(guildId);
    if (!guildData)
        throwStaticError(STATIC_ERROR_CODES.SERVER_NOT_REGISTERED, 'verifyAdminPermission');

    const { admins } = guildData as AllyGuildDataInterface;
    if (!admins) return false;

    return admins.includes(username);
};
