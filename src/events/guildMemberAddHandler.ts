import { GuildMember } from 'discord.js';

import logger from '../lib/logger.js';

export const guildMemberAddHandler = (member: GuildMember) => {
    if (member.user.bot) {
        logger.debug(`Ignored new guild member (Bot): ${member.user.tag} in ${member.guild.name}`);
        return;
    }
};
