import { Client, GatewayIntentBits, Partials, Options, Collection } from "discord.js";
import { BotHandler, Command, SlashCommand, BanSchema } from "./types";
import { config } from "dotenv";
import { readdirSync } from "fs";
import { join } from "path";
config();

const tokens: { token: string, id: string; }[] = process.env.TOKENS.split(",").map((token, index) => ({ token, id: process.env.CLIENT_IDS.split(",")[index] }));

const clients = tokens.map(() => new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages,

        GatewayIntentBits.GuildMembers,     // Privileged Intent
        // GatewayIntentBits.MessageContent // Privileged Intent Required
    ],
    partials: [Partials.Channel],
    makeCache: Options.cacheWithLimits({
        MessageManager: 0,
        DMMessageManager: 0,
        GuildMessageManager: 0,
        UserManager: 0,
    }),
    shards: "auto",
}));

clients.forEach((client, index) => {
    client.login(tokens[index].token);

    client.id = tokens[index].id;
    client.token = tokens[index].token;

    client.bannedUsers = new Collection<string, BanSchema>();
    client.slashCommands = new Collection<string, SlashCommand>();
    client.commands = new Collection<string, Command>();
    client.cooldowns = new Collection<string, number>();

    const handlersDir = join(__dirname, "./handlers");
    readdirSync(handlersDir).forEach(handler => {
        if (!handler.endsWith(".js")) return;
        let event: BotHandler = require(`${handlersDir}/${handler}`).default;
        if (!event.disabled && (index === 0 || !event.once)) event.execute(client);
    });
});

// Don't crash :mikuhappy:
process.on('uncaughtException', error => {
    console.log(error.stack);
});
