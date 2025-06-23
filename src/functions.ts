import { ButtonInteraction, DMChannel, GuildMember, PartialDMChannel, PermissionFlagsBits, PermissionResolvable, TextChannel } from "discord.js";

export const checkPermissions = (member: GuildMember, permissions: Array<PermissionResolvable>) => {
    let neededPermissions: PermissionResolvable[] = [];
    permissions.forEach(permission => {
        if (!member.permissions.has(permission)) neededPermissions.push(permission);
    });
    if (neededPermissions.length === 0) return null;
    return neededPermissions.map(p => {
        if (typeof p === "string") return p.split(/(?=[A-Z])/).join(" ");
        else return Object.keys(PermissionFlagsBits).find(k => Object(PermissionFlagsBits)[k] === p)?.split(/(?=[A-Z])/).join(" ");
    });
};

export const sendTimedMessage = (message: string, channel: TextChannel, duration: number) => {
    return channel.send(message).then(m => setTimeout(async () => (await channel.messages.fetch(m)).delete(), duration));
};

export const sendTimedMessageDM = (message: string, channel: DMChannel | PartialDMChannel, duration: number) => {
    return channel.send(message).then(m => setTimeout(async () => (await channel.messages.fetch(m)).delete(), duration));
};

export const replyToButton = async (interaction: ButtonInteraction, { content, ephemeral }: { content: string, ephemeral: boolean; }): Promise<void> => {
    try {
        await interaction.followUp({ content, ephemeral });
    } catch {
        try {
            await interaction.reply({ content, ephemeral });
        } catch {
            try {
                await interaction.followUp({ content, ephemeral });
            } catch {
                try {
                    await interaction.reply({ content, ephemeral });
                } catch { };
            };
        };
    };
};

export const daysSince = (lastDate: Date) => {
    if (!lastDate) return 0;
    const now = new Date();
    // set to midnight
    now.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

export const showPage = <T>(currPage: number, arr: T[], elements: number = 15): T[] => {
    return arr.slice((currPage - 1) * elements, currPage * elements);
};

export const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
