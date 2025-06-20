import { ComponentType, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { Emojis, OfferRow } from "../shared/components";
import { updateUsers, getUserSchema } from "../shared/queries";

const command = new SlashCommandBuilder()
    .setName('give')
    .setDescription('Give stamps to another user')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user to give stamps to')
            .setRequired(true))
    .addIntegerOption(option =>
        option.setName('amount')
            .setDescription('The amount of stamps to give')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(1000000));

const exportCommand: SlashCommand = {
    command,
    cooldown: 10,
    async execute({ interaction, author }) {

        const targetUser = interaction.options.getUser('user', true);
        const amount = interaction.options.getInteger('amount', true);

        // Validation checks
        if (targetUser.id === interaction.user.id) return interaction.reply({ content: "You cannot give stamps to yourself!", ephemeral: true });
        if (targetUser.bot) return interaction.reply({ content: "You cannot give stamps to bots!", ephemeral: true });
        if (amount <= 0) return interaction.reply({ content: "Amount must be greater than 0!", ephemeral: true });
        if (author.schema.stamps < amount) return interaction.reply({ content: `You don't have enough stamps! You have **${author.schema.stamps}x** ${Emojis.Stamps} but tried to give **${amount}x** ${Emojis.Stamps}.`, ephemeral: true });

        // Check if target exists
        const targetSchema = await getUserSchema(targetUser.id);
        if (!targetSchema) return interaction.reply({ content: `${targetUser.username} doesn't have an account yet. They need to use the bot first to create an account.`, ephemeral: true });

        // Confirmation
        return interaction.reply({ content: `Do you want to give **${amount}x** ${Emojis.Stamps} to ${targetUser.username}?`, components: [OfferRow] }).then(msg => {

            const collector = msg.createMessageComponentCollector({ filter: (r) => r.user.id === interaction.user.id, componentType: ComponentType.Button, time: 60000 });

            collector.on('collect', async (r) => {
                collector.stop();
                if (r.customId === "cancel") return interaction.followUp({ content: "Transfer cancelled.", ephemeral: true });

                // Refresh sender's schema to get current stamps (in case they changed)
                const currentSenderSchema = await getUserSchema(interaction.user.id);
                if (!currentSenderSchema) return interaction.followUp({ content: "Error: Could not retrieve your current data. Please try again.", ephemeral: true });
                if (currentSenderSchema.stamps < amount) return interaction.followUp({ content: `Error: You no longer have enough stamps. You currently have **${currentSenderSchema.stamps}x** ${Emojis.Stamps}.`, ephemeral: true });

                try {
                    await updateUsers(interaction.user.id, {
                        stamps: { type: "increment", value: -amount }
                    });

                    await updateUsers(targetUser.id, {
                        stamps: { type: "increment", value: amount }
                    });

                    return interaction.followUp(`🎉 Successfully gave **${amount}x** ${Emojis.Stamps} to ${targetUser.username}!`);
                } catch (error) {
                    console.error('Give command error:', error);
                    return interaction.followUp({ content: "❌ An error occurred during the transfer. Please try again.", ephemeral: true });
                };
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    interaction.followUp({ content: "Transfer timed out. Please try again.", ephemeral: true });
                };
            });
        });
    },
};

export default exportCommand;
