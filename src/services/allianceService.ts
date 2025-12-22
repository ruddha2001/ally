import { alliance, allliancePosition } from 'pnwkit-2.0/build/src/interfaces/queries/alliance.js';
import { AllyAllianceInterface } from '../@types/alliances.js';
import logger from '../lib/logger.js';
import { Database } from '../lib/mongoDbClient.js';
import { PnwKit } from '../lib/pnwKit.js';
import { QUERIES } from './queries.js';

const convertPnWAllianceToAllyAlliance = (pnwAlliance: alliance): AllyAllianceInterface => {
    const transformedAlliance: AllyAllianceInterface = {
        id: pnwAlliance.id as string,
        name: pnwAlliance.name as string | undefined,
        acronym: pnwAlliance.acronym as string | undefined,
        color: pnwAlliance.color as string | undefined,
        score: pnwAlliance.score as number | undefined,
        discord_link: pnwAlliance.discord_link as string | undefined,
        alliance_positions: pnwAlliance.alliance_positions
            ?.map((position: allliancePosition) => ({
                id: position.id as string,
                name: position.name as string,
                permissions: {
                    view_bank: position.view_bank as boolean,
                    accept_applicants: position.accept_applicants as boolean,
                    withdraw_bank: position.withdraw_bank as boolean,
                    remove_members: position.remove_applicants as boolean,
                },
                position_level: position.position_level as number,
                is_leader: position.leader as boolean,
            }))
            .sort((pos1, pos2) => pos1.position_level - pos2.position_level),
        ally_last_updated: new Date(),
    };
    return transformedAlliance;
};

export const updateAllianceData = async (alliance: AllyAllianceInterface) => {
    await (await Database.getDatabase()).collection('alliances').updateOne(
        {
            id: alliance.id,
        },
        {
            $set: { ...alliance },
        },
        {
            upsert: true,
        },
    );
};

export const getAllianceById = async (allianceId: string, validity: number = 5) => {
    logger.debug(`[getAllianceById] Start | Alliance ID: ${allianceId}`);
    let finalAllianceObject = await (await Database.getDatabase())
        .collection('alliances')
        .findOne<AllyAllianceInterface>({
            id: allianceId,
        });

    if (finalAllianceObject) {
        logger.debug(
            `[getAllianceById] Database | Found Alliance ID: ${allianceId} - Checking Validity ${JSON.stringify(finalAllianceObject)}`,
        );
        if (
            finalAllianceObject.ally_last_updated &&
            new Date().getTime() - new Date(finalAllianceObject.ally_last_updated).getTime() <=
                validity * 60 * 1000
        ) {
            logger.debug(
                `[getAllianceById] Database | Valid Alliance ID: ${allianceId} - Returning ${JSON.stringify(finalAllianceObject)}`,
            );
            return finalAllianceObject;
        }
    }

    logger.debug(`[getAllianceById] PnW API | Querying API for: ${allianceId}`);
    let pnwAllianceData: alliance[] | undefined;
    try {
        pnwAllianceData = await PnwKit.getKit()?.allianceQuery(
            { first: 1, id: [Number(allianceId)] },
            QUERIES.GET_ALLIANCE_QUERY,
        );
    } catch (err) {
        logger.debug(
            `[getAllianceById] End | Error Querying PnW API for: ${allianceId}, returning null`,
            err,
        );
        return null;
    }

    if (!pnwAllianceData || !Array.isArray(pnwAllianceData) || pnwAllianceData.length === 0) {
        return null;
    }

    const transformedAlliance = convertPnWAllianceToAllyAlliance(pnwAllianceData[0]);

    logger.debug(`[getAllianceById] Database | Updating Alliance ID: ${allianceId}`);
    await updateAllianceData(transformedAlliance);
    logger.debug(`[getAllianceById] Database | Successfully updated Alliance ID: ${allianceId}`);

    logger.debug(
        `[getSingleNationByNationId] End | Alliance ID: ${allianceId} - Returning ${JSON.stringify(transformedAlliance)}`,
    );
    return transformedAlliance;
};
