import { Interaction, PermissionsBitField } from "discord.js";
import { BotEvent, Locale } from "../types";
import { Links } from "../shared/components";
import { addUserToServer, getServerSchema, getUserSchema, insertNewServer, insertNewUser } from "../shared/queries";

const event: BotEvent = {
    name: "interactionCreate",
    execute: async (interaction: Interaction) => {
        if (interaction.user.bot) return;

        // return if banned
        const isBanned = interaction.client.bannedUsers.get(interaction.user.id);
        if (isBanned) {
            if (interaction.isChatInputCommand()) interaction.reply(`Your account has been suspended${isBanned.reason ? ` for "${isBanned.reason}"` : ""}.\nIf you believe there to be a mistake, please join our support server below to appeal for this decision.\n**Support Server**: ${Links.Support}`);
            return;
        };

        if (interaction.isChatInputCommand()) {
            if (interaction.user.bot) return;
            if (!interaction.guild) return interaction.reply({ content: `Please use the bot on a server.`, ephemeral: true });
            if (interaction.guild.members.me?.isCommunicationDisabled()) return;

            // Get Command
            const command = interaction.client.slashCommands.get(interaction.commandName);
            if (!command) return;

            // ADD NEW PLAYERS
            const author = {
                schema: await getUserSchema(interaction.user.id) ?? await insertNewUser(interaction.user.id, interaction.user.username),
            };
            if (author.schema.name !== interaction.user.username) author.schema = await insertNewUser(interaction.user.id, interaction.user.username);

            // ADD NEW SERVERS
            const server = {
                schema: await getServerSchema(interaction.guild.id) ?? await insertNewServer(interaction.guild.id, interaction.guild.name, [interaction.user.id]),
            };
            if (!server.schema.user_ids.includes(interaction.user.id)) await addUserToServer(interaction.guild.id, interaction.user.id);

            // Set locale
            const locale: Locale = (author.schema.lang ?? (['en_US', 'de_DE', 'es_ES', 'fr_FR', 'it_IT', 'ja_JP', 'ko_KR', 'ru_RU', 'tr_TR', 'vi_VN'].find((lang) => lang.startsWith(interaction.guildLocale?.split("-")?.[0] || "xyz")) || 'en_US')) as Locale;

            // Permissions
            if (interaction.guild) {
                // Bot Permissions
                if (interaction.guild.members.me?.isCommunicationDisabled() || !interaction.guild.members.me?.permissions.has([PermissionsBitField.Flags.SendMessages])) return;
                if (!interaction.guild.members.me?.permissions.has([PermissionsBitField.Flags.UseExternalEmojis, PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.AttachFiles])) return interaction.reply({ content: `Missing Permissions, please make sure ${interaction.client.user.username} has the following permissions:\n-Send Messages\n- Attach Files\n- Embed Links\n- Use External Emojis\nNote that some commands may require additional permissions to work`, ephemeral: true });
                // if (command.permissions && !interaction.guild.members.me?.permissions.has(command.permissions.map((e) => PermissionsBitField.Flags[e]))) return interaction.reply({ content: `Missing Permissions, please make sure ${interaction.client.user.username} has the following permissions:\n- ${command.permissions.join("\n- ")}`, ephemeral: true });

                // User Permissions
                if (command.permissions && !interaction.memberPermissions?.has(command.permissions.map((e) => PermissionsBitField.Flags[e]))) return interaction.reply({ content: `You are not authorized to use this command\nRequired Permissions:\n- ${command.permissions.join("\n- ")}`, ephemeral: true });
            };

            // Cooldown
            const cooldown = interaction.client.cooldowns.get(`${interaction.commandName}-${interaction.user.username}`);
            if (command.cooldown) {
                if (cooldown && Date.now() < cooldown) return interaction.reply({ content: `Please wait ${Math.ceil((cooldown - Date.now()) / 1000)}s to use this command again`, ephemeral: true });
                interaction.client.cooldowns.set(`${interaction.commandName}-${interaction.user.username}`, Date.now() + command.cooldown * 1000);
                setTimeout(() => interaction.client.cooldowns.delete(`${interaction.commandName}-${interaction.user.username}`), command.cooldown * 1000);
            };

            return command.execute({ interaction, locale, author, server });
        };

        if (interaction.isAutocomplete()) {
            const command = interaction.client.slashCommands.get(interaction.commandName);
            if (!command) return console.error(`No command matching ${interaction.commandName} was found.`);
            if (!command.autocomplete) return;

            const focusedValue = interaction.options.getFocused();
            // const autocomplete = command.autocomplete({interaction});
            const choices = await command.autocomplete({ interaction }); // .filter((e) => e.name.toLowerCase().includes(focusedValue.toLowerCase()));

            return interaction.respond(choices.slice(0, 25));
        };

        // Defer Buttons
        if (interaction.isButton()) {
            if (interaction.customId?.startsWith("ignore_defer")) return;
            interaction.deferUpdate().catch(() => {
                console.log(`ERROR 'deferUpdate()' Button Interaction with customId "${interaction.customId}" Failed`);
            });
        };

    },
};

export default event;
