import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import logger from '../lib/logger.js';

/**
 * Custom error type used across the bot to attach a user-facing description to an error.
 *
 * The `message` is prefixed with `[functionName]` for easier tracing in logs, while
 * `description` is intended to be shown to the end user (e.g., in a Discord embed).
 */
export class AllyError extends Error {
    description?: string;
    constructor(message: string, functionName: string, description?: string) {
        super(`[${functionName}] ${message}`);
        this.name = 'AllyError';
        this.description = description;
    }
}

export enum STATIC_ERROR_CODES {
    INVALID_ALLIANCE_ID = 'INVALID_ALLIANCE_ID',
    INVALID_DISCORD = 'INVALID_DISCORD',
    INVALID_NATION_ID = 'INVALID_NATION_ID',
    MISSING_AUDIT_DATA = 'MISSING_AUDIT_DATA',
    NO_AUDIT_ROLE = 'NO_AUDIT_ROLE',
    SERVER_NOT_REGISTERED = 'SERVER_NOT_REGISTERED',
    TICKET_NOT_LINKED = 'TICKET_NOT_LINKED',
    USER_NOT_PRIVILEGED = 'USER_NOT_PRIVILEGED',
    USER_NOT_REGISTERED = 'USER_NOT_REGISTERED',
}

export const throwStaticError = (
    errorCode: STATIC_ERROR_CODES,
    functionName: string,
    args?: Record<any, any>,
) => {
    switch (errorCode) {
        case 'INVALID_ALLIANCE_ID':
            throw new AllyError(
                `Parsed Alliance ID is null, input was ${args?.alliance_id_or_link}`,
                functionName,
                `It seems that the Alliance ID/Link you have entered: ${args?.alliance_id_or_link ?? 'None'} is not a valid one.
Please retry; your nation URL will look like https://politicsandwar.com/alliance/id=14196`,
            );
        case 'INVALID_DISCORD':
            throw new AllyError(
                `Discord username does not match nation, nation data is ${args?.nation_discord}, username is ${args?.username}`,
                functionName,
                `I could not match your Discord username with your nation. Either you have entered a wrong nation ID (that does not belong to you), or you have not updated your Discord username in your PnW Account.
                
You can update your discord username at https://politicsandwar.com/nation/edit/
Scroll to the very bottom and update your Discord Username.`,
            );
        case 'INVALID_NATION_ID':
            throw new AllyError(
                `Parsed Nation ID is null, input was ${args?.nation_id_or_link}`,
                functionName,
                `It seems that the Nation ID/Link you have entered: ${args?.nation_id_or_link ?? 'None'} is not a valid one.
Please retry; your nation URL will look like https://politicsandwar.com/nation/id=6`,
            );
        case 'MISSING_AUDIT_DATA':
            throw new AllyError(
                `No audit data for guild`,
                functionName,
                `There is no audit data for this guild.`,
            );
        case 'NO_AUDIT_ROLE':
            throw new AllyError(
                `User does not have audit role`,
                functionName,
                `You do not have the audit role added for yourself.
Please run \`/settings audit show\` to see which role you need for this operation.`,
            );
        case 'SERVER_NOT_REGISTERED':
            throw new AllyError(
                `Guild ID is not in database`,
                functionName,
                `The server you are running this command from is not registered with me.

As a PnW Alliance Management Bot, I can help you only in alliance servers.

If you are the mighty Alliance Leader, please run the command \`/setup\` so that I can connect this server to your alliance. Only an Alliance Leader can register an alliance.`,
            );
        case 'TICKET_NOT_LINKED':
            throw new AllyError(
                `Ticket is not registered to any nation`,
                functionName,
                `This channel is not a ticket that is registered to any nation.
If the nation has a Discord account, please ask them to register with Ally inside this channel.
If the nation is a non-Discord user, please convert this channel to a ticket from Ally Web Portal`,
            );
        case 'USER_NOT_REGISTERED':
            throw new AllyError(
                `Discord user is not in database`,
                functionName,
                `It seems that you are not registered with me.
            
To use my services, I need to know who you are. Please run the command \`/register\` with your nation ID or link so that I can get to know you.`,
            );
        case 'USER_NOT_PRIVILEGED':
            throw new AllyError(
                `User does not have sufficient permissions`,
                functionName,
                `You are not allowed to perform this action. You do not have the required admin permissions on this server.`,
            );
    }
};

export const sharedInteractionErrorHandler = async (
    error: unknown,
    command: ChatInputCommandInteraction,
) => {
    logger.error('Unexpected Error - handled by sharedInteractionErrorHandler', error);
    if (!command.replied) {
        if (error instanceof AllyError && error.description) {
            const content = {
                embeds: [
                    new EmbedBuilder()
                        .setColor('Orange')
                        .setTitle(`There was an issue executing /${command.commandName} for you`)
                        .setDescription(error.description)
                        .setFooter({
                            text: 'You can retry this operation by following the instructions above, ensuring you are entering correct parameters. If the issue persists, raise a ticket at https://ally.ani.codes/support',
                        }),
                ],
            };
            if (command.deferred) {
                await command.editReply(content);
            } else {
                await command.reply(content);
            }
        } else {
            const content = {
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('Unexpected Error')
                        .setDescription(
                            `Well I encountered an error that I do not know how to deal with.`,
                        )
                        .addFields({ name: 'command', value: command.commandName })
                        .setFooter({
                            text: 'You can retry this operation. If the issue persists, raise a ticket at https://ally.ani.codes/support',
                        }),
                ],
            };
            if (command.deferred) {
                await command.editReply(content);
            } else {
                await command.reply(content);
            }
        }
    }
};
