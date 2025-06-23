import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.PG_USER,
    host: 'localhost',
    database: process.env.PG_DATABASE, // trackalot
    password: process.env.PG_PASSWORD,
    port: parseInt(process.env.PG_PORT), // 5432
});

export const query = async (text: string, params?: any[]) => {
    try {
        const res = await pool.query(text, params);
        if (text.toUpperCase().startsWith("SELECT")) return res.rows;
        return res;
    } catch (error) {
        console.error(error);
        throw error;
    };
};

// Create Extensions
const createExtensions = async () => {
    await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
};

// Create Tables
const createTables = async () => {
    await query(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        created TIMESTAMP DEFAULT NOW(),
        deleteacc TIMESTAMP,
        prefix TEXT,
        lang TEXT,
        stamps INT DEFAULT 0 NOT NULL,
        stamps_total INT DEFAULT 0 NOT NULL,
        pending_stamps INT DEFAULT 0 NOT NULL,
        lastonline TIMESTAMP DEFAULT NOW(),
        lastvote TIMESTAMP,
        lastdaily TIMESTAMP,
        dailystreak INT DEFAULT 0 NOT NULL,
        votestotal INT DEFAULT 0 NOT NULL,
        votereminder BOOLEAN DEFAULT FALSE NOT NULL,
        transactions JSONB[] DEFAULT ARRAY[]::JSONB[] NOT NULL,

        -- Roles
        is_admin BOOLEAN DEFAULT FALSE NOT NULL,
        is_developer BOOLEAN DEFAULT FALSE NOT NULL,
        is_overseer BOOLEAN DEFAULT FALSE NOT NULL,
        is_coordinator BOOLEAN DEFAULT FALSE NOT NULL,
        is_group_lead BOOLEAN DEFAULT FALSE NOT NULL,

        -- Permissions
        can_assign_stamps BOOLEAN DEFAULT FALSE NOT NULL

    )`);

    await query(`CREATE TABLE IF NOT EXISTS servers (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        user_ids TEXT[] NOT NULL,
        prefix TEXT,
        created TIMESTAMP DEFAULT NOW()
    )`);

    await query(`CREATE TABLE IF NOT EXISTS bans (
        id TEXT PRIMARY KEY NOT NULL,
        banned_by TEXT NOT NULL,
        reason TEXT,
        expires TIMESTAMP,
        created TIMESTAMP DEFAULT NOW()
    )`);

    await query(`CREATE TABLE IF NOT EXISTS task_posts (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        requirements TEXT NOT NULL,
        rewards TEXT NOT NULL,
        body TEXT NOT NULL,
        intro TEXT,
        interested_users TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
        status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
        created TIMESTAMP DEFAULT NOW()
    )`);

    await query(`CREATE TABLE IF NOT EXISTS contributions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        awarded_by TEXT NOT NULL,
        stamps_awarded INT NOT NULL,
        description TEXT,
        created TIMESTAMP DEFAULT NOW()
    )`);

};

// Create Triggers
const createTriggers = async () => {
    // Remove user id from servers
    await query(`
        CREATE OR REPLACE FUNCTION remove_user_id_from_servers() RETURNS TRIGGER AS $$
        BEGIN
            UPDATE servers SET user_ids = array_remove(user_ids, OLD.id);
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
    `, []);
    await query(`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'remove_user_id_after_delete') THEN
                CREATE TRIGGER remove_user_id_after_delete
                AFTER DELETE ON users
                FOR EACH ROW EXECUTE PROCEDURE remove_user_id_from_servers();
            END IF;
        END $$;
    `, []);
};

const updateTables = async () => {

    // await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS guesses INT DEFAULT 0 NOT NULL`);
    // await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS dailytrades INT DEFAULT 0 NOT NULL`);

};

// Run functions
(async () => {
    try {
        await createExtensions();
        await createTables();
        await updateTables();
        await createTriggers();

        const [{ size }] = await query(`SELECT pg_size_pretty(pg_database_size('${process.env.PG_DATABASE}')) AS size;`) as [{ size: string; }];

        console.log(`Database initialization complete\nDatabase size: ${size}`);
    } catch (error) {
        console.error('Database initialization failed:', error);
    };
})();
