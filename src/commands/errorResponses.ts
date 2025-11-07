import { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js';

export class ErrorResponses {
    static async UNEXPECTED_EXCEPTION(command: ChatInputCommandInteraction | ButtonInteraction) {
        await command.reply(`
Opps! I hit an uninteded snag ⚠️
Please retry your current operation, and if the issue persists, lodge a complaint at https://ally.ani.codes/complaint`);
    }
    static async INVALID_NATION_ID(command: ChatInputCommandInteraction) {
        await command.reply(`
It seems that your nation ID/URL is not a valid one.
Please retry; your nation URL will look like https://politicsandwar.com/nation/id=6`);
    }
    static async NOT_IN_ALLIANCE(command: ChatInputCommandInteraction) {
        await command.reply(`
You are not in the alliance that you are trying to register for. You can only register for your own alliance where you are the Leader`);
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
    static async NOT_REGISTERD(command: ChatInputCommandInteraction) {
        await command.reply(`
It seems that I do not know who you are. Please use \'/register\' and follow the instructions before retrying again.`);
    }
    static async NOT_PRIVILEDGED(
        command: ChatInputCommandInteraction,
        required: string,
        present: string,
    ) {
        await command.reply(`
You do not have the priviledge to run this command. You need to be a ${required} or above. You are currently a ${present}.`);
    }
    static async NOT_REGISTERED_ALLIANCE(command: ChatInputCommandInteraction) {
        await command.reply(`
You are trying to run an alliance settings command but you have not configured this server to be a part of any alliance.
Please run \`/setup\` to configure this server for your alliance. Alliances can be configured only by the Leader of the alliance.`);
    }
}
