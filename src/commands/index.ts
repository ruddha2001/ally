import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { DiscordCommandType, DiscordOptionType } from '../@types/commands.js';
import logger from '../lib/logger.js';

const staticOptions: Record<string, { description: string; type: ApplicationCommandOptionType }> = {
    nation_id_or_link: {
        description: 'Enter your numeric Nation ID, or enter the full URL to your nation',
        type: ApplicationCommandOptionType.String,
    },
};

const optionsGenerator = (
    optionList: Array<{ name: string; optional?: boolean }>,
): DiscordOptionType[] => {
    const options: DiscordOptionType[] = [];
    optionList.forEach((option) => {
        const { name, optional } = option;
        const staticOptionRecord = staticOptions[name];
        if (!staticOptionRecord) {
            logger.warn(`[optionsGenerator] Ignoring unknown command: ${name}`);
        }
        options.push({
            name,
            ...staticOptionRecord,
            required: !optional,
        });
    });
    return options;
};

export const commandList: DiscordCommandType[] = [
    {
        name: 'register',
        description: 'Register your PnW Account with Ally to use all Ally services.',
        options: optionsGenerator([{ name: 'nation_id_or_link' }]),
    },
    {
        name: 'setup',
        description: 'Setup your alliance use Ally in this server.',
        options: [
            {
                name: 'alliance_id_or_link',
                description:
                    'Enter your numeric Alliance ID, or enter the full URL to your alliance',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'welcome_channel',
                description: 'The channel to welcome new members',
                type: ApplicationCommandOptionType.Channel,
                required: true,
            },
            {
                name: 'unverified_role',
                description: 'The initial role that is assigned by default to all new members',
                type: ApplicationCommandOptionType.Role,
                required: true,
            },
            {
                name: 'registered_role',
                description:
                    'A role that allows registered members access to their application tickets and other channels',
                type: ApplicationCommandOptionType.Role,
                required: true,
            },
        ],
    },
    {
        name: 'applicant_settings',
        description: 'New Applicant Management - Settings',
        options: [
            {
                name: 'ia_role',
                description: 'The server IA Role to ping IA staff for new members',
                type: ApplicationCommandOptionType.Role,
                required: true,
            },
            {
                name: 'member_role',
                description: 'The server member role to assign a new member after promotion',
                type: ApplicationCommandOptionType.Role,
                required: false,
            },
            {
                name: 'applicant_category',
                description: 'Enter the category under which to create applicant tickets',
                type: ApplicationCommandOptionType.Channel,
                required: false,
                channel_types: [ChannelType.GuildCategory],
            },
        ],
    },
    {
        name: 'glance',
        description: 'Get the most important info about the nation',
        options: optionsGenerator([{ name: 'nation_id_or_link', optional: true }]),
    },
];
