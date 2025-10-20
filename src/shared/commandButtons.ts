import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { BUTTONS } from '../../constants.js';

const applyButton = new ButtonBuilder()
    .setCustomId(BUTTONS.APPLY_BUTTON)
    .setLabel('Apply Now')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('📜');

export const buttonRowBuilder = (buttonList: string[]) => {
    const buttonArray: ButtonBuilder[] = [];
    for (const button of buttonList) {
        switch (button) {
            case BUTTONS.APPLY_BUTTON:
                buttonArray.push(applyButton);
        }
    }
    const buttonRow = new ActionRowBuilder();
    buttonArray.forEach((button) => buttonRow.addComponents(button));
    return buttonRow;
};
