import { User, InteractionCollector, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder, ComponentEmojiResolvable, CacheType, SlashCommandBuilder, StringSelectMenuInteraction, Interaction, InteractionResponse, AttachmentBuilder, ActionRowBuilder, EmbedBuilder, BufferResolvable, JSONEncodable, APIAttachment, Attachment, AttachmentPayload, APIActionRowComponent, APIMessageActionRowComponent, ActionRowData, MessageActionRowComponentData, MessageActionRowComponentBuilder, CommandInteraction, ButtonInteraction, Collection, PermissionResolvable, PermissionFlagsBits, Message, AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";

export type Locale = 'en_US' | 'de_DE' | 'es_ES' | 'fr_FR' | 'it_IT' | 'ja_JP' | 'ko_KR' | 'ru_RU' | 'tr_TR' | 'vi_VN';

type RankShopTransaction = {
    authorization?: string;
    txn_id: string;
    status: string;
    buyer_email: string;
    buyer_id?: string;
    product_id: string;
    recurring: boolean;
    price: string;
    price_in_cents: number;
    currency: string;
    first_purchase: boolean;
    timestamp: number;
};

interface UserSchema {
    id: string;
    name: string;
    created: Date;
    deleteacc: Date | null;
    prefix: string | null;
    lang: string | null;
    stamps: number;
    stamps_total: number;
    pending_stamps: number;
    lastonline: Date;
    lastvote: Date | null;
    lastdaily: Date | null;
    dailystreak: number;
    votestotal: number;
    votereminder: boolean;
    transactions: RankShopTransaction[];

    // Roles
    is_admin: boolean;
    is_developer: boolean;
    is_overseer: boolean;
    is_coordinator: boolean;
    is_group_lead: boolean;

    // Permissions
    can_assign_stamps: boolean;
}

interface ServerSchema {
    id: string;
    name: string;
    user_ids: string[];
    prefix: string | null;
    created: Date;
}

interface BanSchema {
    id: string;
    banned_by: string;
    reason: string | null;
    expires: Date | null;
    created: Date;
}

interface ContributionSchema {
    id: string;
    user_id: string;
    awarded_by: string;
    stamps_awarded: number;
    description: string | null;
    created: Date;
}



// Helper type to get array keys from UserSchema
type ArrayKeys<T> = {
    [K in keyof T]: T[K] extends Array<any> ? K : never
}[keyof T];

// Helper type to get number keys from UserSchema
type NumberKeys<T> = {
    [K in keyof T]: T[K] extends number ? K : never
}[keyof T];

// Helper type to get JSON object keys from UserSchema
type JsonKeys<T> = {
    [K in keyof T]: T[K] extends object ? K : never
}[keyof T];

type UpdateUserOperation<K extends keyof UserSchema> =
    // Simple set operation - works with any key
    | { type: 'set'; value: UserSchema[K]; }

    // Increment operation - only works with number fields
    | (K extends NumberKeys<UserSchema>
        ? { type: 'increment'; value: number; }
        : never)

    // Array operations - only work with array fields
    | (K extends ArrayKeys<UserSchema>
        ? { type: 'append'; value: UserSchema[K]; }
        | { type: 'append_unique'; value: UserSchema[K]; }
        | { type: 'remove'; value: UserSchema[K]; }
        | { type: 'remove_all'; value: UserSchema[K]; }
        : never)

    // JSON operations - only work with object fields
    | (K extends JsonKeys<UserSchema>
        ? { type: 'set_json'; value: UserSchema[K]; }
        | { type: 'merge_json'; value: Partial<UserSchema[K]>; }
        : never);

export type UpdateUserOptions = {
    [K in keyof Partial<UserSchema>]: UpdateUserOperation<K>;
};



interface executeSlashCommand {
    interaction: ChatInputCommandInteraction,
    locale: Locale,
    author: { schema: UserSchema; },
    server: { schema: ServerSchema; },
    reply?: any,
    warn?: any,
    customFlag?: any,
}

interface helpCommand {
    interaction?: ChatInputCommandInteraction,
    message?: Message,
    commandName: string,
    locale: Locale,
}

export interface SlashCommand {
    command: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder,
    execute: ({ }: executeSlashCommand) => void,
    help?: ({ }: helpCommand) => void,
    // execute: ({interaction: ChatInputCommandInteraction, text: string}) => void,
    autocomplete?: ({ }: { interaction: AutocompleteInteraction; }) => Promise<Array<{ name: string, value: string; }>>,
    /**
     * @description The cooldown for the command in seconds
     */
    cooldown?: number,
    permissions?: Array<keyof typeof PermissionFlagsBits>,
}

interface executeCommand {
    message: Message,
    args: Array<string>,
    cmd: string,
    prefix: string,
    locale: Locale,
    author: { schema: UserSchema; },
    server: { schema: ServerSchema; },
    msg?: Message,
}

export interface Command {
    name: string,
    aliases: Array<string>,
    permissions: Array<PermissionResolvable>,
    cooldown?: number,
    disabled?: boolean,
    execute: ({ }: executeCommand) => void,
    help?: ({ }: helpCommand) => void,
}

export interface BotEvent {
    name: string,
    once?: boolean,
    disabled?: boolean,
    execute: (...args?) => void;
}

export interface BotHandler {
    name: string,
    once?: boolean,
    disabled?: boolean,
    execute: (...args?) => void;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            TOKENS: string,
            CLIENT_IDS: string,
            PREFIX: string,
            PG_USER: string,
            PG_DATABASE: string,
            PG_PASSWORD: string,
            PG_PORT: string,
            RANK_AUTH: string,
            /**
             * @description The admins of the bot, separated by comma
             * @example "489490486734880774,449931690601873419"
             */
            ADMINS: string,
            VERSION: string,
        }
    }
}

declare module "discord.js" {
    export interface Client {
        id: string;
        token: string;
        bannedUsers: Collection<string, BanSchema>;
        slashCommands: Collection<string, SlashCommand>;
        commands: Collection<string, Command>;
        cooldowns: Collection<string, number>;
    }
}
