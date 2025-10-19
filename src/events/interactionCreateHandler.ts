import { ChatInputCommandInteraction, Interaction } from 'discord.js';

import { setupHandler } from '../commands/setupHandler.js';

export const interactionCreateHandler = (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) {
        return;
    }
    const command = interaction as ChatInputCommandInteraction;
    const commandName = command.commandName;

    switch (commandName) {
        case 'setup':
            setupHandler(command);
    }
};
