import { ChatInputCommandInteraction } from 'discord.js';

export const registerHandler = async (command: ChatInputCommandInteraction) => {
    const { options } = command;

    const nationIdOrLink = options.getString('nation_id_or_link', true);

    await command.reply(`Thank you. I received ${nationIdOrLink}`);
};
