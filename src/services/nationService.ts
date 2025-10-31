import { gql } from '@apollo/client';

import { GqlClient } from '../lib/gqlClient.js';
import {
    AllyNation,
    NationDataInterface,
    NationsInterface,
    StaticNationDataInterface,
} from '../@types/nations.js';
import { Database } from '../lib/mongoDbClient.js';
import { PnwKit } from '../lib/pnwKit.js';
import logger from '../lib/logger.js';
import { nation } from 'pnwkit-2.0/build/src/interfaces/queries/nation.js';

enum QUERIES {
    GET_NATION_QUERY = `
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
}

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

/**
 * Upserts nation verification and dynamic data into MongoDB.
 *
 * - Updates or inserts a static record in 'nationsStatic' with nation ID, expiry (15 days from now), and Discord username.
 * - Updates or inserts dynamic nation data in 'nationsDynamic' with the latest nation info.
 *
 * @param numericNationId The numeric nation ID to upsert
 * @param data The latest nation data to store
 * @param discordUsername The Discord username associated with the nation
 */
export const upsertNationdDataToStorage = async (
    numericNationId: number,
    data: NationDataInterface,
    discordUsername: string,
) => {
    (await Database.getDatabse()).collection('nationsStatic').updateOne(
        {
            nation_id: numericNationId,
        },
        {
            $set: {
                nation_id: numericNationId,
                expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
                discord_username: discordUsername,
            },
        },
        { upsert: true },
    );
    (await Database.getDatabse()).collection('nationsDynamic').updateOne(
        {
            nation_id: numericNationId,
        },
        { $set: data },
        { upsert: true },
    );
};

const verifyNationIntegrity = () => {};

export const getSingleNationDataByDiscordUsername = async (discordUsername: string) => {
    let finalNationObject = await (await Database.getDatabse())
        .collection('nations')
        .findOne<AllyNation>({
            discord_username: discordUsername,
        });

    if (!finalNationObject) {
        return null;
    }

    // Check last updated, then call getSingleNationByNationId() is needed
};

export const getSingleNationByNationId = async (nationId: number): Promise<AllyNation | null> => {
    logger.debug(`[getSingleNationByNationId] Start | Nation ID: ${nationId}`);
    let finalNationObject = await (await Database.getDatabse())
        .collection('nations')
        .findOne<AllyNation>({
            nation_id: nationId,
        });

    if (finalNationObject) {
        logger.debug(
            `[getSingleNationByNationId] End | Nation ID: ${nationId} - Returning ${finalNationObject}`,
        );
        return finalNationObject;
    }

    let pnwNationData: nation[] | undefined;
    try {
        pnwNationData = await PnwKit.getKit()?.nationQuery(
            { id: [nationId], first: 1 },
            QUERIES.GET_NATION_QUERY,
        );
    } catch (err) {
        logger.error(err);
        return null;
    }

    if (!pnwNationData || !Array.isArray(pnwNationData) || pnwNationData.length === 0) {
        return null;
    }

    console.log(pnwNationData);

    logger.debug(`[getSingleNationByNationId] End | Nation ID: ${nationId} - Returning null`);
    return null;
};
