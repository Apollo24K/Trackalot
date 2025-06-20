import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { botPfp, embedColor, Emojis, Links } from "../shared/components";
import { getContributorCount } from "../shared/queries";

const command = new SlashCommandBuilder()
    .setName('about')
    .setDescription('Info about the bot');

function pad(s: number): string {
    return (s < 10 ? '0' : '') + s;
};

function format(sec: number): string {
    let hours = Math.floor(sec / (60 * 60));
    let minutes = Math.floor(sec % (60 * 60) / 60);
    let seconds = Math.floor(sec % 60);

    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
};

const exportCommand: SlashCommand = {
    command,
    cooldown: 3,
    async execute({ interaction }) {
        const contributors = await getContributorCount();

        const Embed = new EmbedBuilder()
            .setTitle('Trackalot')
            .setColor(embedColor)
            .setThumbnail(botPfp)
            .setDescription(`A [Camelot](<${Links.Camelot}>) helper bot. Contribute to camelot to earn stamps! ${Emojis.Stamps}\n\nTrackalot's code is accessible on our [GitHub](<${Links.Github}>), where you can contribute too! Please see our [LICENSE](<${Links.License}>) if you're interested!\n\n[Terms of Service](<${Links.Terms}>) | [Privacy Policy](<${Links.Privacy}>)`)
            .setFooter({ text: `Trackalot V${process.env.VERSION} • Made by Trackalot`, iconURL: botPfp })
            .addFields(
                { name: "Stats", value: `Servers: **${interaction.client.guilds.cache.size}**\nContributors: **${contributors}**`, inline: true },
                { name: '_ _', value: `RAM Usage: **${Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 10) / 10} MB**\nUptime: **${format(process.uptime())}**`, inline: true },
            );
        return interaction.reply({ embeds: [Embed] });
    },
};

export default exportCommand;
