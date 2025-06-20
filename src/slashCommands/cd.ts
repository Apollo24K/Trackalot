import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { getUserSchema } from "../shared/queries";

const command = new SlashCommandBuilder()
    .setName('cd')
    .addUserOption(option => option.setName('user').setDescription('See the cooldowns of a user').setRequired(false))
    .setDescription('Check your cooldowns');

const exportCommand: SlashCommand = {
    command,
    cooldown: 5,
    async execute({ interaction, author }) {

        const user = interaction.options.getUser('user') ?? interaction.user;

        const stats = (user.id === interaction.user.id) ? author.schema : await getUserSchema(user.id);
        if (!stats) return interaction.reply({ content: (user.id === interaction.user.id) ? "You don't have an account" : `${user.username} doesn't have an account`, ephemeral: true });

        const now = new Date();

        const slashCmds = await interaction.client.application?.commands.fetch();
        const dailyCmd = slashCmds?.find(e => e.name === "daily");

        // Messages
        let dailymsg = `Your daily is ready! => ${dailyCmd ? `</${dailyCmd.name}:${dailyCmd.id}>` : "`/daily`"}`;

        // Daily
        if (stats.lastdaily && stats.lastdaily.toDateString() === now.toDateString()) {
            const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
            const timeLeft = midnight.getTime() - now.getTime();
            const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutesLeft = Math.ceil((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            dailymsg = `${hoursLeft > 0 ? `**${hoursLeft}**h ` : ''}**${minutesLeft}**min left`;
        };

        return interaction.reply(`**Daily**: ${dailymsg}`);
    },
};

export default exportCommand;
