import { ComponentType, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { Emojis, OfferRow } from "../shared/components";
import { updateUsers, getUserSchema } from "../shared/queries";

const command = new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer stamps to Camelot');

const exportCommand: SlashCommand = {
    command,
    cooldown: 10,
    async execute({ interaction, author }) {

        if (author.schema.stamps <= 0) {
            return interaction.reply({ content: `Transfer amount must be greater than 0!`, ephemeral: true });
        };

        return interaction.reply({ content: `Do you want to transfer your **${author.schema.stamps}x** ${Emojis.Stamps} to Camelot? This action is irreversible. Make sure Camelot is online at the time of transfer.`, components: [OfferRow] }).then(msg => {
            const collector = msg.createMessageComponentCollector({ filter: (r) => r.user.id === interaction.user.id, componentType: ComponentType.Button, time: 60000 });

            collector.on('collect', async (r) => {
                collector.stop();
                if (r.customId === "cancel") return interaction.followUp({ content: "Action cancelled", ephemeral: true });

                // Refresh schema to get current stamps
                const stats = await getUserSchema(interaction.user.id);
                if (!stats) return interaction.followUp({ content: "Error: Could not retrieve your current data. Please try again.", ephemeral: true });
                if (stats.stamps <= 0) return interaction.followUp({ content: "Error: You have no stamps to transfer.", ephemeral: true });

                try {
                    // Make POST request to Camelot's stamps endpoint
                    const stampsPort = process.env.STAMPS_PORT || '3001';
                    const response = await fetch(`http://127.0.0.1:${stampsPort}/stamps`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            userId: interaction.user.id,
                            stamps: stats.stamps
                        }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                        throw new Error(`Transfer failed: ${errorData.error || response.statusText}`);
                    };

                    // Deduct stamps from current user after successful transfer
                    await updateUsers(interaction.user.id, {
                        stamps: { type: "increment", value: -stats.stamps }
                    });

                    return interaction.followUp(`🎉 <@${interaction.user.id}> successfully transferred **${stats.stamps}x** ${Emojis.Stamps} to Camelot!`);
                } catch (error) {
                    console.error('Transfer error:', error);
                    await interaction.followUp(`❌ Transfer failed: Unknown error occurred. Your stamps have not been deducted.`);
                };
            });
        });

    },
};

export default exportCommand;
