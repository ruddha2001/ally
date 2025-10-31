import { ChatInputCommandInteraction } from 'discord.js';

import { checkNationVerificationStatus, getNationData } from '../services/nationService.js';
import { ErrorResponses } from '../commands/errorResponses.js';
import { NationDataInterface } from '../@types/nations.js';

type SupportedVerificationLevels = 'LEADER' | 'MEMBER'; // TODO: Read this from alliance info?

export const verifyCommandPriviledge = async (
    command: ChatInputCommandInteraction,
    filter: {
        numericNationId?: number;
        discordUsername?: string;
    },
    level?: SupportedVerificationLevels,
): Promise<NationDataInterface | null> => {
    let verificationStatus: {
        status: boolean;
        expired: boolean;
        nationId: number | null;
    } | null = null;
    const { user } = command;
    const { discordUsername, numericNationId } = filter;
    if (!discordUsername && !numericNationId) {
        throw new Error('No filter was passed to verifyCommandPriviledge');
    }
    if (discordUsername) {
        verificationStatus = await checkNationVerificationStatus({
            discord_username: user.username,
        });
    }
    if (numericNationId) {
        verificationStatus = await checkNationVerificationStatus({
            nation_id: numericNationId,
        });
    }
    if (!verificationStatus || !verificationStatus.status) {
        await ErrorResponses.NOT_REGISTERD(command);
        return null;
    }
    if (!verificationStatus.expired) {
        // TODO: Try to auto-reverify
    }

    const nationData = await getNationData(verificationStatus.nationId as number);
    if (!nationData) throw new Error('Invalid nation requested in verifyCommandPriviledge'); // TODO: This should be handled

    if (!level) {
        return nationData;
    }

    const { alliance_position } = nationData;

    if (alliance_position !== level) {
        await ErrorResponses.NOT_PRIVILEDGED(command, level, alliance_position ?? 'NON-MEMBER');
        return null;
    }

    return nationData;
};

export const getVerifiedNationData = async (nationId: number) => {};
