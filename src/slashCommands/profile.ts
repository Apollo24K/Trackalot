import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { botPfp, embedColor, Emojis } from "../shared/components";
import { getUserSchema } from "../shared/queries";

const command = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your or another user\'s profile')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user whose profile you want to view')
            .setRequired(false));

const exportCommand: SlashCommand = {
    command,
    cooldown: 3,
    async execute({ interaction, author }) {

        const user = interaction.options.getUser('user') ?? interaction.user;

        const stats = (user.id === interaction.user.id) ? author.schema : await getUserSchema(user.id);
        if (!stats) return interaction.reply({ content: (user.id === interaction.user.id) ? "You don't have an account" : `${user.username} doesn't have an account`, ephemeral: true });

        const Embed = new EmbedBuilder()
            .setAuthor({ name: `${user.username}'s profile`, iconURL: user.avatarURL({ size: 256 }) ?? botPfp })
            .setColor(embedColor)
            .setThumbnail(botPfp)
            .setDescription(
                `**Stamps**: \`${stats.stamps}\`${Emojis.Stamps}ㅤ**Stamps Total**: \`${stats.stamps_total}\`${Emojis.Stamps}\n` +
                ``
            )
            .setFooter({ text: `Account created ${stats.created.toUTCString()}` });

        return interaction.reply({ embeds: [Embed] });
    },
};

export default exportCommand;
