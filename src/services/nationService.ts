import { gql } from '@apollo/client';

import { GqlClient } from '../lib/gqlClient.js';
import {
    NationDataInterface,
    NationsInterface,
    StaticNationDataInterface,
} from '../@types/nations.js';
import { Database } from '../lib/mongoDbClient.js';

export const getNationData = async (nationId: number): Promise<NationDataInterface | null> => {
    const response = await GqlClient.getClient().query<{ nations: NationsInterface }>({
        query: gql`
            query ($nationId: [Int]) {
                nations(id: $nationId) {
                    data {
                        nation_name
                        leader_name
                        discord
                    }
                }
            }
        `,
        variables: {
            nationId,
        },
    });
    const { data } = response;
    const nations = data?.nations;
    const nationsData = nations?.data;
    if (!nationsData || nationsData.length === 0) {
        return null;
    }
    return nationsData[0];
};

export const checkNationVerificationStatus = async (
    numericNationId: number,
): Promise<{ status: boolean; expired: boolean }> => {
    const result = await (await Database.getDatabse())
        .collection('nationsStatic')
        .findOne<StaticNationDataInterface>({ nation_id: numericNationId });
    if (!result) {
        return {
            status: false,
            expired: false,
        };
    }
    if (result.expires_at < new Date()) {
        return {
            status: true,
            expired: true,
        };
    }
    return {
        status: true,
        expired: false,
    };
};

export const upsertNationdDataToStorage = async (
    numericNationId: number,
    data: NationDataInterface,
) => {
    (await Database.getDatabse()).collection('nationsStatic').updateOne(
        {
            nation_id: numericNationId,
        },
        {
            $set: {
                nation_id: numericNationId,
                expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
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
