import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { Emojis } from "../shared/components";
import { daysSince } from "../functions";
import { updateUsers } from "../shared/queries";

const command = new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward');

function streakEmoji(dailystreak: number) {
    if (dailystreak < 3) return "";
    if (dailystreak < 7) return "<a:fire_y:936975489862623253>";
    if (dailystreak < 14) return "<a:fire_b:936975541058273370>";
    if (dailystreak < 30) return "<a:fire_m:936975577171259413>";
    return "<a:fire_p:936975620708134992>";
};

const exportCommand: SlashCommand = {
    command,
    cooldown: 5,
    async execute({ interaction, author }) {

        const daysPassed = author.schema.lastdaily ? daysSince(author.schema.lastdaily) : 1;
        if (daysPassed < 1) return interaction.reply({ content: `You can use this command only once per day!`, ephemeral: true });

        // Streak
        if (daysPassed === 1) author.schema.dailystreak++;
        else author.schema.dailystreak = 1;

        // Reward
        const stamps = 1;

        // Update users table
        await updateUsers(interaction.user.id, {
            stamps: { type: "increment", value: stamps },
            stamps_total: { type: "increment", value: stamps },
            dailystreak: { type: "set", value: author.schema.dailystreak },
            lastdaily: { type: "set", value: new Date() },
        });

        interaction.reply(`Added **${stamps}x** ${Emojis.Stamps} to your balance\n<:stars_v2:917023655840591963> Daily Streak: ${author.schema.dailystreak} ${streakEmoji(author.schema.dailystreak)}`);
    },
};

export default exportCommand;
