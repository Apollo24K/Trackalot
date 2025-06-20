import { Client, Routes, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";
import { REST } from "@discordjs/rest";
import { readdirSync } from "fs";
import { join } from "path";
import { BotHandler, Command, SlashCommand } from "../types";

const handler: BotHandler = {
    name: "Command",
    execute: (client: Client) => {
        const slashCommands: (SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder)[] = [];
        const commands: Command[] = [];

        let slashCommandsDir = join(__dirname, "../slashCommands");
        let commandsDir = join(__dirname, "../commands");

        readdirSync(slashCommandsDir).forEach(file => {
            if (!file.endsWith(".js")) return;
            let command: SlashCommand = require(`${slashCommandsDir}/${file}`).default;
            slashCommands.push(command.command);
            client.slashCommands.set(command.command.name, command);
        });

        readdirSync(commandsDir).forEach(file => {
            if (!file.endsWith(".js")) return;
            let command: Command = require(`${commandsDir}/${file}`).default;
            if (!command.disabled) {
                commands.push(command);
                client.commands.set(command.name, command);
            };
        });

        const rest = new REST({ version: '10' }).setToken(client.token ?? "");

        rest.put(Routes.applicationCommands(client.id), {
            body: slashCommands.map(command => command.toJSON())
        })
            .then((data: any) => {
                console.log(`❇️  Loaded ${data.length} slash command(s)`);
                console.log(`❇️  Loaded ${commands.length} command(s)`);
            }).catch(e => {
                console.log(`❌ Couldn't load commands:`, e);
            });
    },
};

export default handler;