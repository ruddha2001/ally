import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { CommandType } from '../@types/commands.js';

export const commandList: CommandType[] = [
    {
        name: 'register',
        description: 'Register your PnW Account with Ally to use all Ally services.',
        options: [
            {
                name: 'nation_id_or_link',
                description: 'Enter your numeric Nation ID, or enter the full URL to your nation',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
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
];
