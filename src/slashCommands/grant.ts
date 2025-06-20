import { ComponentType, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { Emojis, OfferRow } from "../shared/components";
import { updateUsers, getUserSchema, insertNewContribution } from "../shared/queries";

const command = new SlashCommandBuilder()
    .setName('grant')
    .setDescription('Grant stamps to a user (Admin only)')
    .addStringOption(option =>
        option.setName('type')
            .setDescription('Type of stamps to grant')
            .setRequired(true)
            .addChoices(
                { name: 'reward', value: 'reward' },
                { name: 'pool', value: 'pool' }
            ))
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user to grant stamps to')
            .setRequired(true))
    .addIntegerOption(option =>
        option.setName('amount')
            .setDescription('The amount of stamps to grant')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(1000))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for granting stamps')
            .setRequired(true)
            .setMaxLength(200));

const exportCommand: SlashCommand = {
    command,
    cooldown: 10,
    async execute({ interaction, author }) {

        // Check if user has permission to assign stamps
        if (!author.schema.canAssignStamps) return interaction.reply({ content: "❌ You don't have permission to grant stamps!", ephemeral: true });

        const grantType = interaction.options.getString('type', true) as 'reward' | 'pool';
        const targetUser = interaction.options.getUser('user', true);
        const amount = interaction.options.getInteger('amount', true);
        const reason = interaction.options.getString('reason', true);

        // Validation checks
        if (targetUser.id === interaction.user.id) return interaction.reply({ content: "You cannot grant stamps to yourself!", ephemeral: true });
        if (targetUser.bot) return interaction.reply({ content: "You cannot grant stamps to bots!", ephemeral: true });
        if (amount <= 0) return interaction.reply({ content: "Amount must be greater than 0!", ephemeral: true });

        // Check if target exists
        const targetSchema = await getUserSchema(targetUser.id);
        if (!targetSchema) return interaction.reply({ content: `${targetUser.username} doesn't have an account yet. They need to use the bot first to create an account.`, ephemeral: true });

        // Determine which field to update
        const stampType = grantType === 'reward' ? 'stamps' : 'pending_stamps';
        const typeDisplay = grantType === 'reward' ? 'reward stamps' : 'pool stamps';

        // Confirmation
        return interaction.reply({ content: `Do you want to grant **${amount}x** ${Emojis.Stamps} (${typeDisplay}) to ${targetUser.username}?`, components: [OfferRow] }).then(msg => {

            const collector = msg.createMessageComponentCollector({ filter: (r) => r.user.id === interaction.user.id, componentType: ComponentType.Button, time: 60000 });

            collector.on('collect', async (r) => {
                collector.stop();
                if (r.customId === "cancel") return interaction.followUp({ content: "Grant cancelled.", ephemeral: true });

                try {
                    await updateUsers(targetUser.id, {
                        [stampType]: { type: "increment", value: amount }
                    });

                    // Log contribution
                    if (grantType === 'reward') {
                        await insertNewContribution(targetUser.id, interaction.user.id, amount, reason.slice(0, 200));
                    };

                    return interaction.followUp(`🎉 Successfully granted **${amount}x** ${Emojis.Stamps} (${typeDisplay}) to ${targetUser.username}!`);
                } catch (error) {
                    console.error('Grant command error:', error);
                    return interaction.followUp({ content: "❌ An error occurred during the grant. Please try again.", ephemeral: true });
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    interaction.followUp({ content: "Grant timed out. Please try again.", ephemeral: true });
                };
            });
        });
    },
};

export default exportCommand;
