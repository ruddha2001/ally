import { ApplicationCommandOptionType, ChannelType } from 'discord.js';

export type DiscordOptionType = {
    name: string;
    description: string;
    type: ApplicationCommandOptionType;
    required: boolean;
    channel_types?: ChannelType[];
};

export type DiscordCommandType = {
    name: string;
    description: string;
    options?: DiscordOptionType[];
};
