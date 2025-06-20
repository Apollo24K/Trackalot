import { ChannelType, Message } from "discord.js";
import { checkPermissions, sendTimedMessage } from "../functions";
import { BotEvent, Locale } from "../types";
import { Links } from "../shared/components";
import { addUserToServer, getServerSchema, getUserSchema, insertNewServer, insertNewUser } from "../shared/queries";

const event: BotEvent = {
    name: "messageCreate",
    execute: async (message: Message) => {
        if (message.author.bot) return;
        if (!(message.channel.type === ChannelType.GuildText && message.guild)) return;

        // return if banned
        const isBanned = message.client.bannedUsers.get(message.author.id);
        if (isBanned) {
            if (message.channel.isSendable()) message.channel.send(`Your account has been suspended${isBanned.reason ? ` for "${isBanned.reason}"` : ""}.\nIf you believe there to be a mistake, please join our support server below to appeal for this decision.\n**Support Server**: ${Links.Support}`);
            return;
        };

        // Create Prefix
        let prefix = process.env.PREFIX;
        if (message.content.startsWith(`<@${message.client.user.id}>`)) prefix = `<@${message.client.user.id}>`;
        if (!message.content.startsWith(prefix)) return;

        // Prepare command
        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const cmd = args.shift()?.toLowerCase();
        if (!cmd) return;

        // See if command exists
        const command = message.client.commands.get(cmd) || message.client.commands.find((command) => command.aliases.includes(cmd));
        if (!command) {
            const slashCmds = await message.client.application?.commands.fetch();
            const slashCmd = slashCmds.find(e => e.name === cmd);
            if (slashCmd && message.channel.isSendable()) message.channel.send(`A prefix version of the </${slashCmd.name}:${slashCmd.id}> command doesn't exist yet, please use the slash counterpart for now`);
            return;
        };


        // ADD NEW PLAYERS
        const author = {
            schema: await getUserSchema(message.author.id) ?? await insertNewUser(message.author.id, message.author.username),
        };
        if (author.schema.name !== message.author.username) author.schema = await insertNewUser(message.author.id, message.author.username);

        // ADD NEW SERVERS
        const server = {
            schema: await getServerSchema(message.guild.id) ?? await insertNewServer(message.guild.id, message.guild.name, [message.author.id]),
        };
        if (!server.schema.user_ids.includes(message.author.id)) await addUserToServer(message.guild.id, message.author.id);

        // Set locale
        const locale: Locale = (author.schema.lang ?? (['en_US', 'de_DE', 'es_ES', 'fr_FR', 'it_IT', 'ja_JP', 'ko_KR', 'ru_RU', 'tr_TR', 'vi_VN'].find((lang) => lang.startsWith(message.guild?.preferredLocale?.split("-")?.[0] || "xyz")) || 'en_US')) as Locale;

        // Check Permissions in Guild
        if (message.channel.type === ChannelType.GuildText && message.member) {
            // Check Member Permissions
            let neededPermissions = checkPermissions(message.member, command.permissions);
            if (neededPermissions !== null) return sendTimedMessage(`You don't have enough permissions to use this command. Needed permissions:\n- ${neededPermissions.join("\n- ")}`, message.channel, 5000);
        };

        // Cooldown
        const cooldown = message.client.cooldowns.get(`${command.name}-${message.author.username}`);
        if (command.cooldown) {
            if (cooldown && Date.now() < cooldown) {
                if (message.channel.type === ChannelType.GuildText) sendTimedMessage(`Please wait ${Math.floor((cooldown - Date.now()) / 1000)}s to use this command again.`, message.channel, 5000);
                return;
            };
            message.client.cooldowns.set(`${command.name}-${message.author.username}`, Date.now() + command.cooldown * 1000);
            setTimeout(() => message.client.cooldowns.delete(`${command?.name}-${message.member?.user.username}`), command.cooldown * 1000);
        };

        command.execute({ message, author, server, args, locale, cmd, prefix });
    },
};

export default event;