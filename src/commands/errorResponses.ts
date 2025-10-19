import { ChatInputCommandInteraction } from 'discord.js';

export class ErrorResponses {
    static async UNEXPECTED_EXCEPTION(command: ChatInputCommandInteraction) {
        await command.reply(`
Opps! I hit an uninteded snag ⚠️
Please retry your current operation, and if the issue persists, lodge a complaint at https://ally.ani.codes/complaint`);
    }
    static async INVALID_NATION_ID(command: ChatInputCommandInteraction) {
        await command.reply(`
It seems that your nation ID/URL is not a valid one.
Please retry; your nation URL will look like https://politicsandwar.com/nation/id=6`);
    }
    static async INVALID_DISCORD_OR_MISMATCH(
        command: ChatInputCommandInteraction,
        isExpired: boolean = false,
    ) {
        await command.reply(
            isExpired
                ? 'It seems you made some changes to your account (discord username or leadername). I will try to update the registration.\n'
                : '' +
                      `
It seems that I could not verify your account. It is beacause of either:
1. You have entered a nation ID/URL that does not belong to you.
2. You have not linked your Discord to your PnW account.
You can add your Discord Username to your PnW account at https://politicsandwar.com/nation/edit/ (scroll to the very bottom)
Please retry again once you are sure your Discord Username is updated in your PnW account and you are using the correct nation ID/URL.`,
        );
    }
}
