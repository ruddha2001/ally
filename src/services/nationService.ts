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

enum QUERIES {
    GET_NATION_QUERY = `
            nation_name
            leader_name
            discord
            id
            alliance_position
            alliance {
                id
                name
            }
            spies
            last_active
            color
            num_cities
            cities {
                infrastructure
            }
        `,
}

const convertPnWNationToAllyNation = (pnwNation: nation): AllyNationInterface => {
    const transformedNation: AllyNationInterface = {
        id: Number(pnwNation.id as string),
        nation_name: pnwNation.nation_name as string | undefined,
        alliance: {
            id: pnwNation.alliance?.id as string | undefined,
            name: pnwNation.alliance?.name as string | undefined,
        },
        alliance_position: pnwNation.alliance_position as string | undefined,
        num_cities: pnwNation.num_cities as number | undefined,
        cities: pnwNation.cities?.map((city) => ({
            infrastructure: city.infrastructure as number,
        })),
        spies: pnwNation.spies as number | undefined,
        last_active: pnwNation.last_active,
        color_block: pnwNation.color as string | undefined,
        ally_last_updated: new Date(),
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

export const getSingleNationDataByDiscordUsername = async (discordUsername: string) => {
    let finalNationObject = await (await Database.getDatabse())
        .collection('nations')
        .findOne<AllyNationInterface>({
            discord_username: discordUsername,
        });

    if (!finalNationObject) {
        return null;
    }

    // Check last updated, then call getSingleNationByNationId() is needed
};

export const getSingleNationByNationId = async (
    nationId: number,
    validity: number = 5,
): Promise<AllyNationInterface | null> => {
    logger.debug(`[getSingleNationByNationId] Start | Nation ID: ${nationId}`);
    let finalNationObject = await (await Database.getDatabse())
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
        `[getSingleNationByNationId] End | Nation ID: ${nationId} - Returning $${JSON.stringify(transformedNation)}`,
    );
    return convertPnWNationToAllyNation(pnwNationData[0]);
};
