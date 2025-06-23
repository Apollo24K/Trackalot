import { EmbedBuilder, GuildMember } from "discord.js";
import { BotEvent } from "../types";
import { botPfp, embedColor, Emojis } from "../shared/components";

const event: BotEvent = {
    name: "guildMemberAdd",
    execute: async (member: GuildMember) => {

        const Embed = new EmbedBuilder()
            .setColor(embedColor)
            .setThumbnail(botPfp)
            .setDescription(
                `## Welcome to Taskalot!\n` +
                `Taskalot is a workspace where you can work together with others to contribute to Camelot & Avalon.\n` +
                `\n` +
                `To get started, please read the rules https://discord.com/channels/1358078718949720264/1358088110218543104 and the procedures https://discord.com/channels/1358078718949720264/1358090721755791711 to get familiar with our workflow.\n` +
                `\n` +
                `To get access to the channels, please write a short application in https://discord.com/channels/1358078718949720264/1358094128319037752 detailing your intentions, i.e. what you want to contribute to, how you think you can contribute etc.\n` +
                `\n` +
                `But most importantly, have fun! ${Emojis.Bruckenpanzeri}`
            );

        // Send DM to user
        const dm = await member.createDM();
        dm?.send({ embeds: [Embed] });

    },
};

export default event;
