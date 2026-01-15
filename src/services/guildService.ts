import { CACHE_KEYS } from '../../constants.js';
import {
    AllyGuildAuditLevel,
    AllyGuildDataInterface,
    AllyManagedChannel,
} from '../@types/guilds.js';
import { Cache } from '../lib/cache.js';
import { Database } from '../lib/mongoDbClient.js';
import type { Document } from 'mongodb';
import { STATIC_ERROR_CODES, throwStaticError } from '../shared/allyError.js';
import { GuildMember } from 'discord.js';

const GUILD_CACHE_PREFIX = 'guild:by_id:';
const GUILD_CACHE_TTL_MS = 5 * 60 * 1000;

const MANAGED_CHANNELS_CACHE_PREFIX = 'guild:managed_channels:';
const MANAGED_CHANNELS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const guildCacheKey = (guildId: string) => `${GUILD_CACHE_PREFIX}${guildId}`;
const managedChannelsCacheKey = (guildId: string) => `${MANAGED_CHANNELS_CACHE_PREFIX}${guildId}`;

export enum RoleManager {
    audit = 'audit',
    build = 'build',
    warChest = 'warChest',
}

export const updateGuildData = async (guildData: AllyGuildDataInterface) => {
    const { _id, ...withoutId } = guildData as unknown as {
        _id?: unknown;
    } & AllyGuildDataInterface;
    await (await Database.getDatabase())
        .collection('guilds')
        .updateOne({ guild_id: guildData.guild_id }, { $set: withoutId }, { upsert: true });

    await Cache.getCache().set(guildCacheKey(guildData.guild_id), withoutId, GUILD_CACHE_TTL_MS);
    await Cache.getCache().delete(managedChannelsCacheKey(guildData.guild_id));
};

export const getGuildDataByGuildId = async (guildId: string) => {
    const cached = await Cache.getCache().get<AllyGuildDataInterface>(guildCacheKey(guildId));
    if (cached) return cached;

    const doc = await (await Database.getDatabase())
        .collection('guilds')
        .findOne<AllyGuildDataInterface>({ guild_id: guildId });

    if (doc) {
        await Cache.getCache().set(guildCacheKey(guildId), doc, GUILD_CACHE_TTL_MS);
    }

    return doc;
};

const getManagedChannels = async (guildId: string) => {
    const cached = await Cache.getCache().get<AllyGuildDataInterface['managed_channels']>(
        managedChannelsCacheKey(guildId),
    );
    if (cached) return cached;

    const guildData = await getGuildDataByGuildId(guildId);
    if (!guildData || !guildData.managed_channels) return null;
    const { managed_channels } = guildData;

    await Cache.getCache().set(
        managedChannelsCacheKey(guildId),
        managed_channels,
        MANAGED_CHANNELS_CACHE_TTL_MS,
    );

    return managed_channels;
};

export const getNationIdFromManagedChannelId = async (
    guildId: string,
    channelId: string,
): Promise<string | null> => {
    const managedChannels = await getManagedChannels(guildId);
    if (!managedChannels) return null;
    const channel = managedChannels[channelId];
    if (!channel) return null;

    return channel.nation_id;
};

export const getManagedChannelDataFromChannelId = async (guildId: string, channelId: string) => {
    const managedChannels = await getManagedChannels(guildId);
    return managedChannels?.[channelId];
};

export const updateManagedChannelDataByChannelId = async (
    guildId: string,
    channelId: string,
    channelData: AllyManagedChannel,
) => {
    await (await Database.getDatabase())
        .collection('guilds')
        .updateOne(
            { guild_id: guildId },
            { $set: { [`managed_channels.${channelId}`]: channelData } },
        );

    await Cache.getCache().delete(guildCacheKey(guildId));
    await Cache.getCache().delete(managedChannelsCacheKey(guildId));
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

/**
 * @deprecated Audit Levels will be removed
 * @param guildId
 * @param levelData
 */
export const addAuditLevel = async (guildId: string, levelData: AllyGuildAuditLevel) => {
    const guildData = await getGuildDataByGuildId(guildId);
    if (!guildData) throwStaticError(STATIC_ERROR_CODES.SERVER_NOT_REGISTERED, 'addAuditRole');

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
    if (!application_settings?.audit)
        throwStaticError(STATIC_ERROR_CODES.MISSING_AUDIT_DATA, 'addAuditRole');

    if (guildData?.application_settings?.audit) {
        guildData.application_settings.audit.audit_role_id = roleId;
    }

    await updateGuildData(guildData as AllyGuildDataInterface);
};

export const removeAuditRole = async (guildId: string, auditLevelId: string) => {
    const guildData = await getGuildDataByGuildId(guildId);
    if (!guildData) throwStaticError(STATIC_ERROR_CODES.SERVER_NOT_REGISTERED, 'removeAuditRole');

    const { application_settings } = guildData as AllyGuildDataInterface;
    if (!application_settings?.audit)
        throwStaticError(STATIC_ERROR_CODES.MISSING_AUDIT_DATA, 'removeAuditRole');

    const updatedAuditLevels: AllyGuildAuditLevel[] =
        application_settings?.audit?.audit_mmr_slabs.filter(
            (level) => level.levelId !== auditLevelId,
        ) ?? [];
    if (guildData?.application_settings?.audit?.audit_mmr_slabs) {
        guildData.application_settings.audit.audit_mmr_slabs = updatedAuditLevels;
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

/**
 * @deprecated User verifyRole()
 * @param guildId
 * @param user
 * @returns
 */
export const verifyAuditPermission = async (
    guildId: string,
    user: GuildMember,
): Promise<boolean> => {
    const guildData = await getGuildDataByGuildId(guildId);
    if (!guildData)
        throwStaticError(STATIC_ERROR_CODES.SERVER_NOT_REGISTERED, 'verifyAuditPermission');

    const { application_settings } = guildData as AllyGuildDataInterface;
    if (!application_settings || !application_settings.audit?.audit_role_id) {
        return false;
    }

    return user.roles.cache.has(application_settings.audit.audit_role_id);
};

export const verifyRole = async (guildId: string, user: GuildMember, role: RoleManager) => {
    const guildData = await getGuildDataByGuildId(guildId);
    if (!guildData) throwStaticError(STATIC_ERROR_CODES.SERVER_NOT_REGISTERED, 'verifyRole');

    const { application_settings } = guildData as AllyGuildDataInterface;
    if (!application_settings || !application_settings.roles || !application_settings.roles[role]) {
        return false;
    }

    return user.roles.cache.has(application_settings.roles[role]);
};
