import { GuildMember } from 'discord.js';

import logger from '../lib/logger.js';
import { getGuildDataFromGuildId } from '../services/guildService.js';
import { buttonRowBuilder } from '../buttons/index.js';
import { BUTTONS } from '../../constants.js';

export const guildMemberAddHandler = async (member: GuildMember) => {
    if (member.user.bot) {
        logger.debug(`Ignored new guild member (Bot): ${member.user.tag} in ${member.guild.name}`);
        return;
    }
    const guildId = member.guild.id;
    const guildData = await getGuildDataFromGuildId(guildId);

    if (!guildData) {
        logger.warn(`Guild ${guildId} is not setup. Ally will not run.`);
        return;
    }

    const { welcome_channel, alliance_name, unverified_role } = guildData;

    const role = member.guild.roles.cache.get(unverified_role);

    if (role) {
        try {
            await member.roles.add(role, 'Automatic assignment upon joining.');
            logger.debug(`Assigned role ${role.name} to new member ${member.user.tag}.`);
        } catch (roleError) {
            logger.error(`Failed to assign role to ${member.user.tag}:`, roleError);
        }
    } else {
        logger.warn(
            `Could not find role with ID ${unverified_role} in guild ${member.guild.name}.`,
        );
    }

    const welcomeChannel = member.guild.channels.cache.get(welcome_channel);

    if (welcomeChannel && welcomeChannel.isTextBased()) {
        try {
            await welcomeChannel.send({
                content: `
Welcome ${member.user}!
We heartily welcome you to **${alliance_name}**!
If you want to apply for this alliance, please click the \`📜 Apply Now\` button at the bottom and we will start the application process.
If you are a FA member, please select \`🌐 FA Diplomat\` button below and you will be redirected to our FA team.
If you have any questions, open up a ticket with the \`❓ Help\` button and a help ticket will be created for you.`,
                components: [buttonRowBuilder([BUTTONS.APPLY_BUTTON]).toJSON()],
            });
            logger.debug(
                `Sent welcome message with button to ${member.user.tag} inside ${member.guild.name}`,
            );
        } catch (error) {
            logger.error(
                `Could not send message to welcome channel for ${member.user.username} inside ${member.guild.name}`,
                error,
            );
        }
    } else {
        logger.warn(
            `Could not find welcome channel with ID ${welcome_channel} in guild ${member.guild.name} or channel is not text based.`,
        );
    }
};
