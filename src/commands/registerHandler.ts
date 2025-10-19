import { ChatInputCommandInteraction } from 'discord.js';

export const registerHandler = async (command: ChatInputCommandInteraction) => {
    const { options } = command;

    const nationIdOrLink = options.getString('nation_id_or_link', true);

    let nationId: string | null = nationIdOrLink;
    if (nationIdOrLink.startsWith('https')) {
        nationId = nationIdOrLink.split('=')[1] ?? null;
    }

    if (!nationId || isNaN(Number(nationId))) {
        await command.reply(
            `
It seems that your nation ID/URL is not a valid one.
Please retry; your nation URL will look like https://politicsandwar.com/nation/id=6`,
        );
        return;
    }

    await command.reply(`Thank you. I received ${nationIdOrLink}`);
};
