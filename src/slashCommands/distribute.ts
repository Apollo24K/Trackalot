import { ComponentType, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { Emojis, OfferRow } from "../shared/components";
import { updateUsers, getUserSchema, insertNewContribution } from "../shared/queries";

const command = new SlashCommandBuilder()
    .setName('distribute')
    .setDescription('Distribute pending stamps to a team member')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user to distribute pending stamps to')
            .setRequired(true))
    .addIntegerOption(option =>
        option.setName('amount')
            .setDescription('The amount of pending stamps to distribute')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(1000000))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for granting stamps')
            .setRequired(true)
            .setMaxLength(200));

const exportCommand: SlashCommand = {
    command,
    cooldown: 10,
    async execute({ interaction, author }) {

        const targetUser = interaction.options.getUser('user', true);
        const amount = interaction.options.getInteger('amount', true);
        const reason = interaction.options.getString('reason', true);

        // Validation checks
        if (targetUser.bot) return interaction.reply({ content: "You cannot distribute pending stamps to bots!", ephemeral: true });
        if (amount <= 0) return interaction.reply({ content: "Amount must be greater than 0!", ephemeral: true });
        if (author.schema.pending_stamps < amount) return interaction.reply({ content: `You don't have enough pending stamps! You have **${author.schema.pending_stamps}x** pending ${Emojis.Stamps} but tried to distribute **${amount}x** pending ${Emojis.Stamps}.`, ephemeral: true });

        // Check if target exists
        const targetSchema = await getUserSchema(targetUser.id);
        if (!targetSchema) return interaction.reply({ content: `${targetUser.username} doesn't have an account yet. They need to use the bot first to create an account.`, ephemeral: true });

        // Confirmation
        return interaction.reply({ content: `Do you want to distribute **${amount}x** pending ${Emojis.Stamps} to ${targetUser.username}?`, components: [OfferRow] }).then(msg => {

            const collector = msg.createMessageComponentCollector({ filter: (r) => r.user.id === interaction.user.id, componentType: ComponentType.Button, time: 60000 });

            collector.on('collect', async (r) => {
                collector.stop();
                if (r.customId === "cancel") return interaction.followUp({ content: "Distribution cancelled.", ephemeral: true });

                // Refresh sender's schema to get current pending stamps (in case they changed)
                const currentSenderSchema = await getUserSchema(interaction.user.id);
                if (!currentSenderSchema) return interaction.followUp({ content: "Error: Could not retrieve your current data. Please try again.", ephemeral: true });
                if (currentSenderSchema.pending_stamps < amount) return interaction.followUp({ content: `Error: You no longer have enough pending stamps. You currently have **${currentSenderSchema.pending_stamps}x** pending ${Emojis.Stamps}.`, ephemeral: true });

                try {
                    await updateUsers(interaction.user.id, {
                        pending_stamps: { type: "increment", value: -amount }
                    });

                    await updateUsers(targetUser.id, {
                        stamps: { type: "increment", value: amount }
                    });

                    // Log contribution
                    await insertNewContribution(targetUser.id, interaction.user.id, amount, reason.slice(0, 200));

                    return interaction.followUp(`🎉 Successfully distributed **${amount}x** pending ${Emojis.Stamps} to ${targetUser.username}! They received **${amount}x** ${Emojis.Stamps}.`);
                } catch (error) {
                    console.error('Distribute command error:', error);
                    return interaction.followUp({ content: "❌ An error occurred during the distribution. Please try again.", ephemeral: true });
                };
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    interaction.followUp({ content: "Distribution timed out. Please try again.", ephemeral: true });
                };
            });
        });
    },
};

export default exportCommand;
