import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import logger from '../lib/logger.js';

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
    INVALID_NATION_ID = 'INVALID_NATION_ID',
    SERVER_NOT_REGISTERED = 'SERVER_NOT_REGISTERED',
    USER_NOT_PRIVILEDGED = 'USER_NOT_PRIVILEDGED',
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
                `It seems that the Alliance ID/Link you have entered: ${args?.alliance_id_or_link} is not a valid one.
Please retry; your nation URL will look like hhttps://politicsandwar.com/alliance/id=14196`,
            );
        case 'INVALID_NATION_ID':
            throw new AllyError(
                `Parsed Nation ID is null, input was ${args?.nation_id_or_link}`,
                functionName,
                `It seems that the Nation ID/Link you have entered: ${args?.nation_id_or_link} is not a valid one.
Please retry; your nation URL will look like https://politicsandwar.com/nation/id=6`,
            );
        case 'SERVER_NOT_REGISTERED':
            throw new AllyError(
                `Guild ID is not in database`,
                functionName,
                `The server you are running this command from is not registered with me.

As a PnW Alliance Management Bot, I can help you only in alliance servers.

If you are the mighty Alliance Leader, please run the command \`/setup\` so that I can connect this server to your alliance. Only an Alliance Leader can register an alliance.`,
            );
        case 'USER_NOT_REGISTERED':
            throw new AllyError(
                `Discord user is not in databse`,
                functionName,
                `It seems that you are not registed with me.
            
To use my services, I need to know who you are. Please run the command \`/register\` with your nation ID or link so that I can get to know you.`,
            );
        case 'USER_NOT_PRIVILEDGED':
            throw new AllyError(
                `User does not have sufficient permissions`,
                functionName,
                `You are not allowed to perform this action. You do not have the required alliance permissions.

You are a ${args?.current_position?.toUpperCase()}.
You need to be a ${args?.required_position?.toUpperCase()} or above.`,
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
