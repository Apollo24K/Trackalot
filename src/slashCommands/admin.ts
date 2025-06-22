import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { query } from "../postgres";
import { insertNewBan, unbanUser } from "../shared/queries";

const command = new SlashCommandBuilder()
    .setName('admin')
    .addStringOption(option => option.setName('action').setDescription('Choose an action to take').setRequired(true))
    .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(false))
    .addBooleanOption(option => option.setName('ephemeral').setDescription('Ephemeral?').setRequired(false))
    .setDescription('Only bot administrators can use this command');

const exportCommand: SlashCommand = {
    command,
    async execute({ interaction }) {

        const user = interaction.options.getUser('user') || null;
        let action = interaction.options.getString('action') || "";
        const ephemeral = interaction.options.getBoolean('ephemeral') ?? true;

        let args = action.trim().split(/ +/g);
        const cmd = args.shift()?.toLowerCase() as string;

        // Return if not admin
        if (!process.env.ADMINS.split(",").includes(interaction.user.id)) return interaction.reply({ content: "You're not allowed to use this command", ephemeral });

        // List all actions
        if (action === "list") {
            return interaction.reply({ content: ">>> `list`\n`set <key> <value> [--table] [WHERE condition]`\n`leave server <guildId>`\n`query <sql>`\n`dm <message>`\n`say <message>`\n`ban <reason> user:@user`\n`exit`", ephemeral });
        };

        // Set db
        if (action.startsWith("set")) {
            const [, key, value, ...rest] = action.split(" ");
            let table = "users", condition = "";

            // Check for table specification
            if (rest.includes("--")) {
                const tableIndex = rest.indexOf("--");
                table = rest[tableIndex + 1];
                rest.splice(tableIndex, 2);
            };

            // Build condition
            if (user) condition = `WHERE id = $2`;
            else if (rest.length >= 2 && rest[0].toLowerCase() === "where") condition = `WHERE ${rest.slice(1).join(" ")}`;

            // Validate inputs
            if (!key || !value) {
                return interaction.reply({ content: "Invalid syntax. Use: set <key> <value> [--table] [WHERE condition]", ephemeral });
            };

            try {
                await query(`UPDATE ${table} SET ${key.toLowerCase()} = $1 ${condition}`, user ? [value, user.id] : [value]);
                return interaction.reply({ content: `Successfully updated ${key} in ${table}`, ephemeral });
            } catch (error) {
                return interaction.reply({ content: `An error occurred while updating the database: ${error}`, ephemeral });
            };
        };

        // Leave Server, usage: /admin leave server <guildId>
        if (action.startsWith("leave server")) {
            const guildId = action.split(" ")[2];
            const guild = interaction.client.guilds.cache.get(guildId);

            if (!guild) return interaction.reply({ content: `Couldn't find guild with ID ${guildId}`, ephemeral });

            try {
                await guild.leave();
                return interaction.reply({ content: `Successfully left guild: ${guild.name} (ID: ${guild.id})`, ephemeral });
            } catch (error) {
                console.error(`Error leaving guild ${guild.id}:`, error);
                return interaction.reply({ content: `An error occurred while trying to leave ${guild.name}. Check console for details.`, ephemeral });
            };
        };

        // Query DB
        if (cmd === "query") {
            const flags = args.filter(arg => arg.startsWith("--")).map(flag => flag.slice(2));
            args = args.filter(arg => !arg.startsWith("--"));

            if (args[0].toUpperCase() === "DROP") return interaction.reply({ content: "not allowed", ephemeral });
            const res = await query(args.join(" ") + (user ? ` WHERE id = '${user.id}'` : ""));

            if (Array.isArray(res)) {
                if (flags.includes("txt")) {
                    const attachment = new AttachmentBuilder(Buffer.from(JSON.stringify(res, null, 2) ?? "", 'utf-8'), { name: 'data.txt' });
                    return interaction.reply({ files: [attachment], content: JSON.stringify(res).slice(0, 2000), ephemeral });
                };
                return interaction.reply({ content: JSON.stringify(res).slice(0, 2000), ephemeral });
            };
            return interaction.reply({ content: "Action Successful", ephemeral });
        };

        // Ban user
        if (cmd === "ban") {
            if (!user) return interaction.reply({ content: "Error: missing user object\n\nUsage: `/admin ban <reason> user:@user`", ephemeral });

            if (!interaction.client.bannedUsers.has(user.id)) {
                const banDetails = await insertNewBan(user.id, interaction.user.id, args.join(" ") || undefined);
                interaction.client.bannedUsers.set(user.id, banDetails);
            };

            return interaction.reply({ content: `${user.username} was banned from using Trackalot`, ephemeral });
        };

        // Unban user
        if (cmd === "unban") {
            if (!user) return interaction.reply({ content: "Error: missing user object\n\nUsage: `/admin unban user:@user`", ephemeral });

            await unbanUser(user.id);

            interaction.client.bannedUsers.delete(user.id);

            return interaction.reply({ content: `${user.username} was unbanned`, ephemeral });
        };

        // Send DM
        if (cmd === "dm") {
            user?.send(args.join(" "));
            return interaction.reply({ content: "Action Successful", ephemeral });
        };

        // Repeat text
        if (cmd === "say") {
            if (interaction.channel?.isSendable()) interaction.channel.send(args.join(" "));
            return;
        };

        // Exit
        if (cmd === "exit" || cmd === "shutdown") {
            interaction.reply({ content: "Shutting down...", ephemeral });
            process.exit(0);
        };

    },
};

export default exportCommand;
