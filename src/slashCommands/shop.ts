import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { botPfp, embedColor, Emojis } from "../shared/components";

const command = new SlashCommandBuilder()
    .setName('shop')
    .setDescription('View the premium shop');

const exportCommand: SlashCommand = {
    command,
    cooldown: 3,
    async execute({ interaction, author }) {



    },
};

export default exportCommand;
