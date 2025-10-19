import { ApplicationCommandOptionType } from 'discord.js';
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
];
