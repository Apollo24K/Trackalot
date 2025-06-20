import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { botPfp, embedColor, Emojis } from "../shared/components";

const command = new SlashCommandBuilder()
    .setName('help')
    .setDescription('View command list or get help for a specific command')
    .addStringOption(option =>
        option.setName('command')
            .setDescription('Get help for a specific command')
            .setRequired(false));

const exportCommand: SlashCommand = {
    command,
    cooldown: 2,
    execute: async ({ interaction }) => {
        let helpCommand = interaction.options.getString('command') ?? "";

        if (!helpCommand) {
            const Embed = new EmbedBuilder()
                .setTitle('Command List')
                .setColor(embedColor)
                .setThumbnail(botPfp)
                .setDescription("Use `/help <command name>` for more information")
                .addFields(
                    { name: `${Emojis.Stamps} Stamps`, value: "`/balance` `/daily` `/cd` `/transfer`\n`/give` `/grant` `/distribute`" },
                    { name: "📊 Profile", value: "`/profile`" },
                    { name: "🎐 Other", value: "`/help` `/about` `/ping`" }
                )
                .setFooter({ text: `Trackalot V${process.env.VERSION} • Made by Taskalot`, iconURL: botPfp });
            return interaction.reply({ embeds: [Embed] });
        };

        // Help command shortcuts
        switch (helpCommand) {
            case "ad": helpCommand = "activity drops"; break;
        };

        // Help pages
        const command = interaction.client.slashCommands.get(helpCommand) || interaction.client.commands.get(helpCommand) || interaction.client.commands.find((command) => command.aliases.includes(helpCommand));
        const Embed = new EmbedBuilder()
            .setTitle(`Help: ${command ? "/" : ""}${helpCommand}`)
            .setColor(embedColor)
            .setThumbnail(botPfp)
            .setFooter({ text: `Trackalot V${process.env.VERSION} • Made by Taskalot`, iconURL: botPfp });

        // Try to match the help page
        switch (helpCommand) {
            case 'about': Embed.setDescription("Info about the bot, including its reach and contribution stats."); break;
            default: Embed.setDescription(command ? "Detailed help for this command is not available yet" : "Help page not found"); break;
        };

        return interaction.reply({ embeds: [Embed] });
    },
};

export default exportCommand;
