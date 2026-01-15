import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { DiscordCommandType, DiscordOptionType } from '../@types/commands.js';
import logger from '../lib/logger.js';

const staticOptions: Record<string, { description: string; type: ApplicationCommandOptionType }> = {
    nation_id_or_link: {
        description: 'Enter your numeric Nation ID, or enter the full URL to your nation',
        type: ApplicationCommandOptionType.String,
    },
    show_result_to_everyone: {
        description: 'Show results in the channel for everyone to see',
        type: ApplicationCommandOptionType.Boolean,
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
        description: 'Setup your alliance to use Ally in this server.',
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
        options: optionsGenerator([
            { name: 'nation_id_or_link', optional: true },
            { name: 'show_result_to_everyone', optional: true },
        ]),
    },
    {
        name: 'settings',
        description: 'Ally settings for this server',
        options: [
            {
                name: 'audit',
                description: 'Settings related to nation auditing levels',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'show',
                        description: 'Show the current audit levels',
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: 'add',
                        description: 'Add an audit level',
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: 'remove',
                        description: 'Remove an audit level',
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: 'role',
                        description: 'Add/update role that is allowed to execute audits',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'audit_role',
                                description:
                                    'Users with this role will be allowed to execute alliance wide audits',
                                type: ApplicationCommandOptionType.Role,
                            },
                        ],
                    },
                    {
                        name: 'channel',
                        description: 'Add/update channel where audit results are posted',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'channel_name',
                                description: 'Audit results will be posted in this channel',
                                type: ApplicationCommandOptionType.Channel,
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        name: 'member',
        description: 'Member specific functions for a ticket',
        options: [
            {
                name: 'build',
                description: 'Settings related to member build template',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'show',
                        description: 'Show the current build assigned for this member',
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: 'set',
                        description: 'Set a build template for this member',
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: 'role',
                        description:
                            '[Admin Only] Specify the role that allows setting build templates',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'build_role',
                                description:
                                    'Users with this role will be allowed to assign build templates',
                                type: ApplicationCommandOptionType.Role,
                            },
                        ],
                    },
                ],
            },
            {
                name: 'war_chest',
                description: 'Settings related to member war chest',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'show',
                        description: 'Show the current war chest assigned for this member',
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: 'set',
                        description: 'Set a war chest template for this member',
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                    {
                        name: 'role',
                        description:
                            '[Admin Only] Specify the role that allows setting war chest templates',
                        type: ApplicationCommandOptionType.Subcommand,
                    },
                ],
            },
        ],
    },
];
