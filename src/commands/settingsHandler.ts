import { ChatInputCommandInteraction } from 'discord.js';
import { AllyError } from '../shared/allyError.js';

const auditShowHandler = async () => {};

export const settingsHandler = async (command: ChatInputCommandInteraction) => {
    try {
        await command.deferReply();
        const group = command.options.getSubcommandGroup();
        const subcommand = command.options.getSubcommand();

        if (group === 'audit') {
            switch (subcommand) {
                case 'show':
            }
        }
    } catch (error) {
        console.error(error);
        if (error instanceof AllyError) {
            throw error;
        } else {
            throw new AllyError('Encountered unexpected error', 'glanceHandler');
        }
    }
};
