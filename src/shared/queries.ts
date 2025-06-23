import { query } from "../postgres";
import { UserSchema, ServerSchema, BanSchema, ContributionSchema, UpdateUserOptions, TaskPostSchema } from "../types";

//----------------//
// SELECT SCHEMAS //
//----------------//

export const getUserSchema = async (userId: string): Promise<UserSchema | undefined> => {
    const [user] = await query(`SELECT * FROM users WHERE id = $1`, [userId]) as UserSchema[];
    return user;
};

export const getUserSchemas = async (userIds: "*" | string[]): Promise<UserSchema[]> => {
    if (userIds === "*") {
        const users = await query(`SELECT * FROM users`) as UserSchema[];
        return users;
    };

    const users = await query(`SELECT * FROM users WHERE id = ANY($1)`, [userIds]) as UserSchema[];
    return users;
};

export const getServerSchema = async (guildId: string): Promise<ServerSchema | undefined> => {
    const [server] = await query(`SELECT * FROM servers WHERE id = $1`, [guildId]) as ServerSchema[];
    return server;
};

export const getServerSchemas = async (guildIds: "*" | string[]): Promise<ServerSchema[]> => {
    if (guildIds === "*") {
        const servers = await query(`SELECT * FROM servers`) as ServerSchema[];
        return servers;
    };

    const servers = await query(`SELECT * FROM servers WHERE id = ANY($1)`, [guildIds]) as ServerSchema[];
    return servers;
};

export const getBanSchema = async (userId: string): Promise<BanSchema | undefined> => {
    const [ban] = await query(`SELECT * FROM bans WHERE id = $1`, [userId]) as BanSchema[];
    return ban;
};

export const getBanSchemas = async (userIds: "*" | string[]): Promise<BanSchema[]> => {
    if (userIds === "*") {
        const bans = await query(`SELECT * FROM bans`) as BanSchema[];
        return bans;
    };

    const bans = await query(`SELECT * FROM bans WHERE id = ANY($1)`, [userIds]) as BanSchema[];
    return bans;
};

export const getTaskPostSchema = async (taskId: string): Promise<TaskPostSchema | undefined> => {
    const [task] = await query(`SELECT * FROM task_posts WHERE id = $1`, [taskId]) as TaskPostSchema[];
    return task;
};

export const getTaskPostSchemas = async (taskIds: "*" | string[]): Promise<TaskPostSchema[]> => {
    if (taskIds === "*") {
        const tasks = await query(`SELECT * FROM task_posts`) as TaskPostSchema[];
        return tasks;
    };

    const tasks = await query(`SELECT * FROM task_posts WHERE id = ANY($1)`, [taskIds]) as TaskPostSchema[];
    return tasks;
};

export const getContributionSchema = async (contributionId: string): Promise<ContributionSchema | undefined> => {
    const [contribution] = await query(`SELECT * FROM contributions WHERE id = $1`, [contributionId]) as ContributionSchema[];
    return contribution;
};

export const getContributionSchemas = async (contributionIds: "*" | string[]): Promise<ContributionSchema[]> => {
    if (contributionIds === "*") {
        const contributions = await query(`SELECT * FROM contributions`) as ContributionSchema[];
        return contributions;
    };

    const contributions = await query(`SELECT * FROM contributions WHERE id = ANY($1)`, [contributionIds]) as ContributionSchema[];
    return contributions;
};



//-------------------//
// SELECT STATEMENTS //
//-------------------//

export const getContributorCount = async (): Promise<number> => {
    const [{ contributors }] = await query(`SELECT COUNT(*) AS contributors FROM users`) as { contributors: number; }[];
    return contributors;
};

export const isUserInTaskPost = async (taskId: string, userId: string): Promise<boolean> => {
    const [task] = await query(`SELECT * FROM task_posts WHERE id = $1 AND $2 = ANY(interested_users)`, [taskId, userId]) as TaskPostSchema[];
    return task ? true : false;
};




//-------------------//
// INSERT STATEMENTS //
//-------------------//

export const insertNewUser = async (id: string, name: string): Promise<UserSchema> => {
    const { rows: [user] } = await query(`INSERT INTO users (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = $2 RETURNING *`, [id, name]) as { rows: UserSchema[]; };
    return user;
};

export const insertNewServer = async (id: string, name: string, userIds: string[]): Promise<ServerSchema> => {
    const { rows: [server] } = await query(`INSERT INTO servers (id, name, user_ids) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING RETURNING *`, [id, name, userIds]) as { rows: ServerSchema[]; };
    return server;
};

export const insertNewBan = async (id: string, banned_by: string, reason?: string, expires?: Date): Promise<BanSchema> => {
    const { rows: [ban] } = await query(`INSERT INTO bans (id, banned_by, reason, expires) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING RETURNING *`, [id, banned_by, reason ?? null, expires ?? null]) as { rows: BanSchema[]; };
    return ban;
};

export const insertNewTaskPost = async (id: string, title: string, requirements: string, rewards: string, body: string, intro: string | null): Promise<TaskPostSchema> => {
    const { rows: [task] } = await query(`INSERT INTO task_posts (id, title, requirements, rewards, body, intro) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING RETURNING *`, [id, title, requirements, rewards, body, intro || null]) as { rows: TaskPostSchema[]; };
    return task;
};

export const insertNewContribution = async (userId: string, awardedBy: string, stampsAwarded: number, description?: string): Promise<ContributionSchema> => {
    const { rows: [contribution] } = await query(`INSERT INTO contributions (user_id, awarded_by, stamps_awarded, description) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING RETURNING *`, [userId, awardedBy, stampsAwarded, description || null]) as { rows: ContributionSchema[]; };
    return contribution;
};




//-------------------------------------------//
//             DELETE STATEMENTS             //
//-------------------------------------------//

export const deleteAllExpiredUsers = async (): Promise<void> => {
    await query('DELETE FROM users WHERE deleteacc < NOW()');
};

export const unbanUser = async (userId: string): Promise<void> => {
    await query('DELETE FROM bans WHERE id = $1', [userId]);
};


//-------------------------------------------//
//             UPDATE STATEMENTS             //
//-------------------------------------------//

export const addUserToServer = async (serverId: string, userId: string): Promise<void> => {
    await query(`UPDATE servers SET user_ids = array_append(user_ids, $1) WHERE id = $2 AND NOT $1 = ANY(user_ids)`, [userId, serverId]);
};

export const addUserToTaskPost = async (taskId: string, userId: string): Promise<void> => {
    await query(`UPDATE task_posts SET interested_users = array_append(interested_users, $1) WHERE id = $2 AND NOT $1 = ANY(interested_users)`, [userId, taskId]);
};

export const removeUserFromTaskPost = async (taskId: string, userId: string): Promise<void> => {
    await query(`UPDATE task_posts SET interested_users = array(select distinct unnest(array_remove(interested_users, $1))) WHERE id = $2`, [userId, taskId]);
};

export const updateUsers = async (
    userIds: string | string[] | "*",
    updates: UpdateUserOptions,
    condition?: string,
): Promise<void> => {
    const setStatements = Object.entries(updates)
        .map(([key, { type, value }], index) => {
            const paramIndex = index + (userIds === "*" ? 1 : 2);

            switch (type) {
                case 'set':
                    return `${key} = $${paramIndex}`;
                case 'increment':
                    return `${key} = ${key} + $${paramIndex}`;
                case 'append':
                    return `${key} = array_cat(${key}, $${paramIndex})`;
                case 'append_unique':
                    return `${key} = array(select distinct unnest(array_cat(${key}, $${paramIndex})))`;
                case 'remove':
                    const elemType = Array.isArray(value) && value.length > 0
                        ? typeof value[0] === 'number'
                            ? 'integer'
                            : 'text'
                        : 'text';
                    return `${key} = (
                        SELECT array_agg(orig.elem ORDER BY orig.idx)
                        FROM (
                            SELECT elem,
                                ROW_NUMBER() OVER (PARTITION BY elem ORDER BY idx) AS rn,
                                idx
                            FROM unnest(${key}) WITH ORDINALITY AS t(elem, idx)
                        ) AS orig
                        LEFT JOIN (
                            SELECT elem,
                                ROW_NUMBER() OVER (PARTITION BY elem ORDER BY idx) AS rn
                            FROM unnest($${paramIndex}::${elemType}[]) WITH ORDINALITY AS t(elem, idx)
                        ) AS rem
                        ON orig.elem = rem.elem
                        AND orig.rn = rem.rn
                        WHERE rem.elem IS NULL
                    )`;
                case 'remove_all':
                    const arrayType = Array.isArray(value) && value.length > 0
                        ? typeof value[0] === 'number'
                            ? 'integer[]'
                            : 'text[]'
                        : 'text[]';
                    return `${key} = COALESCE((
                        SELECT array_agg(elem) 
                        FROM unnest(${key}) elem 
                        WHERE NOT elem = ANY($${paramIndex}::${arrayType})
                    ), '{}')`;
                case 'set_json':
                    return `${key} = $${paramIndex}::jsonb`;
                case 'merge_json':
                    return `${key} = (
                        SELECT jsonb_object_agg(key,
                            CASE
                                WHEN ${key}->key IS NOT NULL AND $${paramIndex}::jsonb->key IS NOT NULL 
                                    AND jsonb_typeof(${key}->key) = 'number' 
                                    AND jsonb_typeof($${paramIndex}::jsonb->key) = 'number' THEN
                                        to_jsonb((${key}->key)::numeric + ($${paramIndex}::jsonb->key)::numeric)
                                WHEN $${paramIndex}::jsonb->key IS NOT NULL THEN
                                    $${paramIndex}::jsonb->key
                                ELSE
                                    ${key}->key
                            END
                        )
                        FROM jsonb_each(COALESCE(${key}, '{}'::jsonb) || $${paramIndex}::jsonb)
                    )`;
                default:
                    throw new Error(`Unknown update type: ${type}`);
            };
        })
        .join(', ');

    const values = Object.values(updates).map(update => update.value);

    if (userIds === "*") {
        await query(
            `UPDATE users SET ${setStatements} ${condition ? `WHERE ${condition}` : ""}`,
            values
        );
    } else {
        const ids = Array.isArray(userIds) ? userIds : [userIds];
        await query(
            `UPDATE users SET ${setStatements} WHERE id = ANY($1) ${condition ? `AND ${condition}` : ""}`,
            [ids, ...values]
        );
    };
};

