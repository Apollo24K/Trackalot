import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { botPfp, embedColor, Emojis } from "../shared/components";
import { getUserSchema } from "../shared/queries";

const command = new SlashCommandBuilder()
    .setName('balance')
    .setDescription('See a user\'s balance')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user to check balance for')
            .setRequired(false));

const exportCommand: SlashCommand = {
    command,
    cooldown: 3,
    async execute({ interaction, author }) {

        const user = interaction.options.getUser('user') ?? interaction.user;

        const stats = (user.id === interaction.user.id) ? author.schema : await getUserSchema(user.id);
        if (!stats) return interaction.reply({ content: (user.id === interaction.user.id) ? "You don't have an account" : `${user.username} doesn't have an account`, ephemeral: true });

        const Embed = new EmbedBuilder()
            .setColor(embedColor)
            .setAuthor({ name: `${user.username}'s Balance`, iconURL: user.displayAvatarURL({ size: 2048 }) })
            .setThumbnail(botPfp)
            .setDescription(`**Stamps**: \`${stats.stamps}\`${Emojis.Stamps}\n**Stamps Total**: \`${stats.stamps_total}\`${Emojis.Stamps}`);

        return interaction.reply({ embeds: [Embed] });
    },
};

export default exportCommand;
