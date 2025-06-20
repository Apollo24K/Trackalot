import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const PageRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('prev')
            .setEmoji('⏪')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('next')
            .setEmoji('⏩')
            .setStyle(ButtonStyle.Secondary),
    );

export const OfferRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('confirm')
            .setEmoji('<:check_icon:683671903143067743>')
            .setLabel('confirm')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cancel')
            .setEmoji('<:stop_icon:683671917353369600>')
            .setLabel('cancel')
            .setStyle(ButtonStyle.Danger),
    );

export const NextRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary),
    );

export const BackRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('back')
            .setLabel('Go Back')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary),
    );

export const KeepAccountRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('keep')
            .setLabel('Yes, Keep My Account')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Go Back')
            .setStyle(ButtonStyle.Secondary),
    );

export const DeleteAccountRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
        new ButtonBuilder()
            .setCustomId('delete')
            .setLabel('Delete Account')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Go Back')
            .setStyle(ButtonStyle.Success),
    );

export enum Constants {
    MaxStampsPerContribution = 100,
}

export const embedColor = 0x8ac5dd;
export const botPfp = "https://i.ibb.co/sJ6RNNBt/image.png";

export enum Links {
    Terms = "https://rank.top/bot/trackalot?page=terms",
    Privacy = "https://rank.top/bot/trackalot?page=privacy",
    Support = "https://discord.gg/zCbXtNVNtw",
    Camelot = "https://rank.top/bot/camelot",
    Vote = "https://rank.top/bot/trackalot/vote",
    Github = "https://github.com/Apollo24K/Trackalot",
    License = "https://github.com/Apollo24K/Trackalot/blob/main/LICENSE.txt",
};

export enum Emojis {
    Stamps = "🎟️",
};
