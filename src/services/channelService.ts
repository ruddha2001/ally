import { Guild } from 'discord.js';
import { validChannelTypes } from '../@types/channels.js';
import { getGuildDataFromGuildId } from './guildService.js';
import { rename } from 'fs';

export const markApplicantChannelAsVerified = async (
    guild: Guild,
    channelName: string,
    nationName: string,
): Promise<void> => {
    const channelToFind = guild.channels.cache.find(
        (channel) => channel.name === channelName.toLowerCase().replace(/\s+/g, '-'), // Normalize for case-insensitive and space-to-hyphen comparison
    );

    if (!channelToFind) {
        return;
    }

    try {
        let renamedChannel;
        if (validChannelTypes.includes(channelToFind.type)) {
            renamedChannel = await channelToFind.setName(`✅ ${nationName}`);
        }

        const guildData = await getGuildDataFromGuildId(guild.id);
        if (guildData) {
            const { application_settings } = guildData;
            if (
                application_settings &&
                application_settings.ia_role &&
                renamedChannel &&
                renamedChannel.isTextBased()
            ) {
                const iaRole = guild.roles.cache.get(application_settings.ia_role);
                await renamedChannel.send({
                    content: `
You have done all that you needed to do!
Now our ${iaRole} will help you get started with the next phase of your onboarding.`,
                });
            }
        }
    } catch {}
};
