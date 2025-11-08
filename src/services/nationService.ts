import { gql } from '@apollo/client';

import { GqlClient } from '../lib/gqlClient.js';
import {
    AllyNationInterface,
    NationDataInterface,
    NationsInterface,
    StaticNationDataInterface,
} from '../@types/nations.js';
import { Database } from '../lib/mongoDbClient.js';
import { PnwKit } from '../lib/pnwKit.js';
import logger from '../lib/logger.js';
import { nation } from 'pnwkit-2.0/build/src/interfaces/queries/nation.js';
import { QUERIES } from './queries.js';

const convertPnWNationToAllyNation = (pnwNation: nation): AllyNationInterface => {
    const transformedNation: AllyNationInterface = {
        id: Number(pnwNation.id as string),
        nation_name: pnwNation.nation_name as string | undefined,
        leader_name: pnwNation.leader_name as string | undefined,
        alliance: {
            id: pnwNation.alliance?.id as string | undefined,
            name: pnwNation.alliance?.name as string | undefined,
        },
        alliance_position: pnwNation.alliance_position as string | undefined,
        num_cities: pnwNation.num_cities as number | undefined,
        cities: pnwNation.cities?.map((city) => ({
            infrastructure: city.infrastructure as number,
        })),
        last_active: pnwNation.last_active,
        color_block: pnwNation.color as string | undefined,
        ally_last_updated: new Date(),
        discord: pnwNation.discord as string | undefined,
        continent: pnwNation.continent as string | undefined,
        war_policy: pnwNation.war_policy as string | undefined,
        domestic_policy: pnwNation.domestic_policy as string | undefined,
        millitary: {
            soldiers: pnwNation.soldiers as number | undefined,
            tanks: pnwNation.tanks as number | undefined,
            aircrafts: pnwNation.aircraft as number | undefined,
            ships: pnwNation.ships as number | undefined,
            missiles: pnwNation.missiles as number | undefined,
            nukes: pnwNation.nukes as number | undefined,
            spies: pnwNation.spies as number | undefined,
        },
    };
    return transformedNation;
};

/**
 * First will check the database, else will query PnW API for nationData
 * @param nationId The numeric nation ID to fetch
 * @returns Nation data
 */
export const getNationData = async (nationId: number): Promise<NationDataInterface | null> => {
    const resultFromDb = await (await Database.getDatabse())
        .collection('nationsDynamic')
        .findOne<NationDataInterface>({ nation_id: nationId });
    if (resultFromDb) {
        return Promise.resolve(resultFromDb);
    }
    const response = await GqlClient.getClient().query<{ nations: NationsInterface }>({
        query: gql`
            query ($nationId: [Int]) {
                nations(id: $nationId) {
                    data {
                        nation_name
                        leader_name
                        discord
                        alliance_position
                        alliance {
                            id
                            name
                        }
                    }
                }
            }
        `,
        variables: {
            nationId,
        },
        fetchPolicy: 'no-cache',
    });
    const { data } = response;
    const nations = data?.nations;
    const nationsData = nations?.data;
    if (!nationsData || nationsData.length === 0) {
        return null;
    }
    return nationsData[0];
};

/**
 * Checks if a nation/user is verified and expiry status of verification (currently set to 15 days)
 * @param filter An object containing either the nationId or the discordUsername
 * @returns Verification status of the nation/user
 */
export const checkNationVerificationStatus = async (filter: {
    nation_id?: number;
    discord_username?: string;
}): Promise<{ status: boolean; expired: boolean; nationId: number | null }> => {
    const result = await (await Database.getDatabse())
        .collection('nationsStatic')
        .findOne<StaticNationDataInterface>(filter);
    if (!result) {
        return {
            status: false,
            expired: false,
            nationId: null,
        };
    }
    if (result.expires_at < new Date()) {
        return {
            status: true,
            expired: true,
            nationId: result.nation_id,
        };
    }
    return {
        status: true,
        expired: false,
        nationId: result.nation_id,
    };
};

export const updateSingleNationData = async (nation: AllyNationInterface) => {
    await (await Database.getDatabse()).collection('nations').updateOne(
        {
            id: nation.id,
        },
        {
            $set: { ...nation },
        },
        {
            upsert: true,
        },
    );
};

export const getSingleNationDataByDiscordUsername = async (
    discordUsername: string,
    validity: number = 5,
) => {
    logger.debug(
        `[getSingleNationDataByDiscordUsername] Start | Discord username: ${discordUsername}`,
    );
    let finalNationObject = await (await Database.getDatabse())
        .collection('nations')
        .findOne<AllyNationInterface>({
            discord: discordUsername,
        });

    if (!finalNationObject) {
        logger.debug(
            `[getSingleNationDataByDiscordUsername] End | Discord username: ${discordUsername} not in database; returning null`,
        );
        return null;
    }

    if (
        finalNationObject.ally_last_updated &&
        new Date().getTime() - new Date(finalNationObject.ally_last_updated).getTime() <=
            validity * 60 * 1000
    ) {
        logger.debug(
            `[getSingleNationDataByDiscordUsername] End | Valid Nation for Discord username: ${discordUsername} - Returning ${JSON.stringify(finalNationObject)}`,
        );
        return finalNationObject;
    }

    finalNationObject = await getSingleNationByNationId(
        finalNationObject.id as number,
        validity,
        true,
    );

    logger.debug(
        `[getSingleNationDataByDiscordUsername] End | Refreshed Nation for Discord username: ${discordUsername} - Returning ${JSON.stringify(finalNationObject)}`,
    );
    return finalNationObject;
};

/**
 * Retrieves a nation's data by nation ID, using cache if available and valid.
 *
 * This function first attempts to fetch the nation data from the database cache.
 * If the cache is valid (within the specified validity window in minutes) and skipCache is false,
 * it returns the cached data. Otherwise, it queries the PnW API for the latest nation data,
 * updates the cache, and returns the fresh data.
 *
 * @param nationId - The numeric nation ID to fetch.
 * @param validity - The cache validity window in minutes (default: 5).
 * @param skipCache - If true, always fetches from the API and updates the cache (default: false).
 * @returns The AllyNationInterface object for the nation, or null if not found or on error.
 */
export const getSingleNationByNationId = async (
    nationId: number,
    validity: number = 5,
    skipCache: boolean = false,
): Promise<AllyNationInterface | null> => {
    logger.debug(`[getSingleNationByNationId] Start | Nation ID: ${nationId}`);
    let finalNationObject: AllyNationInterface | null = null;
    if (!skipCache) {
        finalNationObject = await (await Database.getDatabse())
            .collection('nations')
            .findOne<AllyNationInterface>({
                id: nationId,
            });

        if (finalNationObject) {
            logger.debug(
                `[getSingleNationByNationId] Database | Found Nation ID: ${nationId} - Checking Validity ${JSON.stringify(finalNationObject)}`,
            );
            if (
                finalNationObject.ally_last_updated &&
                new Date().getTime() - new Date(finalNationObject.ally_last_updated).getTime() <=
                    validity * 60 * 1000
            ) {
                logger.debug(
                    `[getSingleNationByNationId] Database | Valid Nation ID: ${nationId} - Returning ${JSON.stringify(finalNationObject)}`,
                );
                return finalNationObject;
            }
        }
    }

    logger.debug(`[getSingleNationByNationId] PnW API | Querying API for: ${nationId}`);
    let pnwNationData: nation[] | undefined;
    try {
        pnwNationData = await PnwKit.getKit()?.nationQuery(
            { id: [nationId], first: 1 },
            QUERIES.GET_NATION_QUERY,
        );
    } catch (err) {
        logger.debug(
            `[getSingleNationByNationId] End | Error Querying PnW API for: ${nationId}, returning null`,
            err,
        );
        return null;
    }

    if (!pnwNationData || !Array.isArray(pnwNationData) || pnwNationData.length === 0) {
        return null;
    }

    const transformedNation = convertPnWNationToAllyNation(pnwNationData[0]);

    logger.debug(`[getSingleNationByNationId] Database | Updating Nation ID: ${nationId}`);
    await updateSingleNationData(transformedNation);
    logger.debug(
        `[getSingleNationByNationId] Database | Successfully updated Nation ID: ${nationId}`,
    );

    logger.debug(
        `[getSingleNationByNationId] End | Nation ID: ${nationId} - Returning ${JSON.stringify(transformedNation)}`,
    );
    return transformedNation;
};
