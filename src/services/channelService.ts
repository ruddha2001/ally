import { ChannelType, Guild, GuildBasedChannel, GuildMember } from 'discord.js';
import { validChannelTypes } from '../@types/channels.js';
import { getGuildDataByGuildId } from './guildService.js';
import { AllyError } from '../shared/allyError.js';
import logger from '../lib/logger.js';

/**
 * Find a guild channel by name using Discord-style "slug" normalization.
 *
 * Normalization:
 * - Lowercases the provided name
 * - Replaces one or more whitespace characters with `-`
 *
 * @param guild - The Discord guild whose channel cache will be searched.
 * @param channelName - The human-readable channel name to look up (will be normalized).
 * @returns The first matching {@link GuildBasedChannel} if found; otherwise `undefined`.
 */
export const findChannelByName = (
    guild: Guild,
    channelName: string,
): GuildBasedChannel | undefined =>
    guild.channels.cache.find(
        (channel) => channel.name === channelName.toLowerCase().replace(/\s+/g, '-'),
    );

/**
 * Fetches a guild channel by its Snowflake ID.
 *
 * This uses Discord.js `guild.channels.fetch`, which may perform an API request if the channel
 * is not present in cache and will resolve to `null` when the channel cannot be found or
 * is inaccessible to the bot.
 *
 * @param guild - The Discord guild used to fetch the channel.
 * @param channelId - The Snowflake ID of the channel to fetch.
 * @returns A promise that resolves to the fetched {@link GuildBasedChannel}, or `null` if not found.
 */
export const findChannelById = async (
    guild: Guild,
    channelId: string,
): Promise<GuildBasedChannel | null> => await guild.channels.fetch(channelId);

/**
 * Marks an applicant's channel as verified by optionally renaming the channel, assigning the verified role
 * to the provided member, and posting a next-steps message tagging the configured IA role (if available).
 *
 * Workflow:
 * - Locates the channel by `channelName` (using {@link findChannelByName} normalization rules).
 * - If the channel type is eligible (see `validChannelTypes`), renames it to `✅ ${nationName}`.
 * - Loads guild configuration via {@link getGuildDataByGuildId}.
 * - If a verified role is configured and exists, adds it to the member.
 * - If an IA role is configured and the channel is text-based, sends a follow-up message mentioning the IA role.
 *
 * @param guild - The Discord guild in which the applicant channel and roles exist.
 * @param user - The guild member to be marked as verified (role will be added if configured).
 * @param channelName - The human-readable applicant channel name to locate (will be normalized).
 * @param nationName - The nation name used when renaming the channel (prefixed with a checkmark).
 * @returns A promise that resolves when processing completes. If the channel is not found, resolves immediately.
 */
export const markApplicantChannelAsVerified = async (
    guild: Guild,
    user: GuildMember,
    channelName: string,
    nationName: string,
): Promise<void> => {
    const channelToFind = findChannelByName(guild, channelName);

    if (!channelToFind) {
        return;
    }

    try {
        let renamedChannel;
        if (validChannelTypes.includes(channelToFind.type)) {
            renamedChannel = await channelToFind.setName(`✅ ${nationName}`);
        }

        const guildData = await getGuildDataByGuildId(guild.id);
        if (guildData) {
            const { application_settings, verified_role } = guildData;
            const verifiedRole = guild.roles.cache.get(verified_role);
            if (verifiedRole) {
                user.roles.add(verifiedRole, 'Member is verified');
            }
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

/**
 * Renames a guild text channel to the provided name.
 *
 * @remarks
 * This helper only supports {@link ChannelType.GuildText}. If the provided channel is `null`
 * or is not a guild text channel, it throws an {@link AllyError}.
 *
 * @param channel - The channel to rename. Must be a non-null guild text channel.
 * @param newChannelName - The new name to apply to the channel.
 * @returns A promise that resolves when the channel has been renamed.
 *
 * @throws {@link AllyError} Thrown when `channel` is `null` or is not a guild text channel.
 */
export const renameChannel = async (
    channel: GuildBasedChannel | null,
    newChannelName: string,
): Promise<void> => {
    if (!channel || channel.type !== ChannelType.GuildText) {
        throw new AllyError(
            'Expected a text based channel to rename',
            'channelService',
            'I was expecting to rename this channel, but it is not the right type of channel.',
        );
    }

    if (channel.name !== newChannelName) {
        await channel.setName(newChannelName);
    } else {
        logger.warn(
            `Attempting to rename channel ${channel.name} (${channel.id}) with the same name`,
        );
    }
};
