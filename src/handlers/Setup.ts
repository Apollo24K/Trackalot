import { Client } from "discord.js";
import { BotHandler } from "../types";
import { getBanSchemas } from "../shared/queries";

const handler: BotHandler = {
    name: "Setup",
    execute: async (client: Client) => {

        // Load Bans
        const bans = await getBanSchemas("*");
        bans.forEach(ban => client.bannedUsers.set(ban.id, ban));

        console.log(`✅ Successfully finished Setup`);
    },
};

export default handler;
