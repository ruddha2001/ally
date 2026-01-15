import { APIEmbedField, ColorResolvable, EmbedBuilder } from 'discord.js';

export enum EmbedType {
    member,
    settings,
}

const FOOTER_TEXT = {
    default: `Powered by Ally: https://ally.ani.codes`,
};

const ColorMap: Record<EmbedType, ColorResolvable> = {
    [EmbedType.member]: 'Yellow',
    [EmbedType.settings]: 'Fuchsia',
};

const FooterMap: Record<EmbedType, string> = {
    [EmbedType.member]: FOOTER_TEXT.default,
    [EmbedType.settings]: FOOTER_TEXT.default,
};

export const buildDiscordEmbed = (options?: {
    type?: EmbedType;
    title?: string;
    description?: string;
    fields?: APIEmbedField[];
    skipFooter?: boolean;
}) => {
    const embed = new EmbedBuilder();

    if (options?.type !== undefined) {
        embed.setColor(ColorMap[options.type]);
    }

    if (options?.title) {
        embed.setTitle(options.title);
    }

    if (options?.description) {
        embed.setDescription(options.description);
    }

    if (options?.fields) {
        embed.setFields(options.fields);
    }

    if (!options?.skipFooter) {
        embed.setFooter({
            text: options?.type !== undefined ? FooterMap[options.type] : FOOTER_TEXT.default,
        });
    }

    return embed;
};
