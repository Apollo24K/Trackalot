import { Client } from "discord.js";
import { BotHandler } from "../types";
import { deleteAllExpiredUsers } from "../shared/queries";

const handler: BotHandler = {
    name: "Time",
    once: true,
    execute: (client: Client) => {
        setTimeout(() => setInterval(async () => {
            const now = new Date();

            // Daily
            if (now.getHours() === 0 && now.getMinutes() === 0) {
                // Delete Accounts
                await deleteAllExpiredUsers();
            };

        }, 60000), 60000 - (Date.now() % 60000));
    },
};

export default handler;
