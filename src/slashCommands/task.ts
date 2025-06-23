import { SlashCommandBuilder, ChannelType, TextBasedChannel, ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { SlashCommand } from "../types";
import { uuidv4 } from "../functions";
import { Emojis, OfferRow } from "../shared/components";
import { getTaskPostSchema, insertNewTaskPost } from "../shared/queries";

const command = new SlashCommandBuilder()
    .setName('task')
    .setDescription('Create and manage tasks')
    .addSubcommand(subcommand => subcommand
        .setName('post')
        .setDescription('Post a task with requirements and rewards')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the task')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('requirements')
                .setDescription('The requirements for the task')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('rewards')
                .setDescription('The rewards for completing the task')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('body')
                .setDescription('The detailed description of the task')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('intro')
                .setDescription('The introduction to the task')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('ping')
                .setDescription('The roles to ping')
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to post the task in (defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(false)))
    .addSubcommand(subcommand => subcommand
        .setName('view')
        .setDescription('View a task by its UUID')
        .addStringOption(option =>
            option.setName('uuid')
                .setDescription('The UUID of the task to view')
                .setRequired(true)));

const exportCommand: SlashCommand = {
    command,
    async execute({ interaction, author }) {

        // Only overseers can post tasks
        if (!author.schema.is_overseer) return interaction.reply({ content: "❌ You don't have permission to use this command. Only overseers can post tasks.", ephemeral: true });

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'post') {
            const title = interaction.options.getString('title', true);
            const intro = interaction.options.getString('intro');
            const requirements = interaction.options.getString('requirements', true);
            const rewards = interaction.options.getString('rewards', true);
            const body = interaction.options.getString('body', true);
            const pingRole = interaction.options.getRole('ping');
            const targetChannel = interaction.options.getChannel('channel') as TextBasedChannel || await interaction.guild?.channels.fetch("1386333991694504068");;
            const uuid = uuidv4();

            // Validate that the target channel is sendable
            if (!targetChannel || !targetChannel.isSendable()) return interaction.reply({ content: "❌ Cannot send messages to the specified channel.", ephemeral: true });

            const JoinRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`join-task-${uuid}`)
                        .setEmoji(Emojis.Bruckenpanzeri)
                        .setLabel(`I'm interested, join the waitlist!`)
                        .setStyle(ButtonStyle.Success),
                );

            const messageContent = `## New Task: ${title}${pingRole ? ` ${pingRole.toString()}` : ""}\n` +
                `${intro ? `${intro.replace(/\\n/g, "\n")}\n\n` : ""}` +
                `**Requirements**: ${requirements}\n\n` +
                `**Rewards**: ${rewards}\n\n` +
                `${body.replace(/\\n/g, "\n")}\n${body.endsWith("```") ? "" : "\n"}` +
                `-# Task UUID: \`${uuid}\``;

            // Send the embed to the target channel
            return interaction.reply({ content: messageContent + `\n\n---\n### Would you like to post this task in <#${targetChannel.id}>?`, components: [OfferRow], allowedMentions: { roles: pingRole ? [pingRole.id] : [] } }).then(async msg => {
                const collector = msg.createMessageComponentCollector({ filter: (r) => r.user.id === interaction.user.id, componentType: ComponentType.Button, time: 60000 });

                collector.on('collect', async (r) => {
                    collector.stop();
                    if (r.customId === "cancel") return interaction.followUp({ content: "Action cancelled" });

                    try {
                        // Insert task post into database
                        await insertNewTaskPost(uuid, title, requirements, rewards, body, intro);

                        // Post task to channel
                        await targetChannel.send({ content: messageContent + "\n​", components: [JoinRow], allowedMentions: { roles: pingRole ? [pingRole.id] : [] } });

                        // Confirm successful posting
                        const confirmationMessage = `✅ Task posted successfully${targetChannel.id === interaction.channel?.id ? "" : ` in ${targetChannel}`}!`;
                        return interaction.followUp({ content: confirmationMessage });
                    } catch (error) {
                        console.error('Error posting task:', error);
                        return interaction.reply({ content: "❌ An error occurred while posting the task. Please try again." });
                    };
                });
            });
        };

        if (subcommand === 'view') {
            const uuid = interaction.options.getString('uuid', true);

            const task = await getTaskPostSchema(uuid);
            if (!task) return interaction.reply({ content: `❌ Task with UUID \`${uuid}\` not found`, ephemeral: true });

            return interaction.reply({ content: `**Task**: ${task.title}\n\n**Waitlist** (${task.interested_users.length} ${task.interested_users.length === 1 ? "member" : "members"})\n${task.interested_users.slice(0, 20).map(userId => `> <@${userId}> | \`${userId}\``).join(", ")}`, allowedMentions: { users: [] } });
        };
    },
};

export default exportCommand;
