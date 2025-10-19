import { Guild, GuildMember } from 'discord.js';

import logger from '../services/logger.js';

export const guildCreateHandler = async (guild: Guild) => {
    logger.info(
        `🚀 Joined a new server: ${guild.name} (${guild.id}). Member count: ${guild.memberCount}`,
    );

    try {
        const owner: GuildMember = await guild.fetchOwner();
        const welcomeText = `
Hello **${owner.user.tag}**!
Thank you for adding me to your server, **${guild.name}**!
I will be helping you manage your alliance effectively.

Before we start, please use the command \`/ally setup\` in the server to register your alliance with me.

Cheers!
From Your Friendly Neighbourhood Alliance Management Bot 🤖
        `.trim();
        await owner.send(welcomeText);
        logger.info(`Successfully messaged the owner of ${guild.name}.`);
    } catch (error) {
        logger.warn(`Could not DM the owner of ${guild.name}. Their DMs might be closed.`);
        logger.error(`Error details on guildCreate for ${guild.name}:`, error);
    }
};
