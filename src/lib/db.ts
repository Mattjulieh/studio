
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Define the global variable for caching the database connection
declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

const dbDir = path.join(process.cwd(), '.db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
export const dbPath = path.join(dbDir, 'chat.db');


function applySchemaAndMigrations(dbInstance: Database.Database) {
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');

    console.log("Applying database schema...");
    dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          passwordHash TEXT,
          phone TEXT,
          status TEXT,
          description TEXT,
          profilePic TEXT,
          flowup_uuid TEXT UNIQUE
        );

        CREATE TABLE IF NOT EXISTS friends (
          user_id TEXT NOT NULL,
          friend_id TEXT NOT NULL,
          addedAt TEXT NOT NULL,
          PRIMARY KEY (user_id, friend_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS friend_requests (
          sender_id TEXT NOT NULL,
          receiver_id TEXT NOT NULL,
          PRIMARY KEY (sender_id, receiver_id),
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS groups (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          creator_id TEXT NOT NULL,
          profilePic TEXT,
          description TEXT,
          FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS group_members (
          group_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          PRIMARY KEY (group_id, user_id),
          FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          chat_id TEXT NOT NULL,
          sender_id TEXT NOT NULL,
          text TEXT,
          timestamp TEXT NOT NULL,
          edited_timestamp TEXT,
          is_transferred INTEGER DEFAULT 0,
          attachment_type TEXT,
          attachment_url TEXT,
          attachment_name TEXT,
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS unread_counts (
          user_id TEXT NOT NULL,
          chat_id TEXT NOT NULL,
          count INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (user_id, chat_id)
        );

        CREATE TABLE IF NOT EXISTS chat_themes (
          user_id TEXT NOT NULL,
          chat_id TEXT NOT NULL,
          theme_color TEXT NOT NULL,
          theme_mode TEXT NOT NULL,
          PRIMARY KEY (user_id, chat_id)
        );

        CREATE TABLE IF NOT EXISTS chat_wallpapers (
            user_id TEXT NOT NULL,
            chat_id TEXT NOT NULL,
            wallpaper_url TEXT NOT NULL,
            PRIMARY KEY (user_id, chat_id)
        );

        CREATE TABLE IF NOT EXISTS private_space_posts (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          text TEXT,
          timestamp TEXT NOT NULL,
          attachment_type TEXT,
          attachment_url TEXT,
          attachment_name TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);
    console.log("Database schema applied.");

    // Column migrations
    try {
        const usersCols = dbInstance.prepare("PRAGMA table_info(users)").all() as { name: string }[];
        if (!usersCols.some(col => col.name === 'description')) {
            console.log("Adding 'description' column to users table...");
            dbInstance.exec('ALTER TABLE users ADD COLUMN description TEXT');
        }
        if (!usersCols.some(col => col.name === 'flowup_uuid')) {
            console.log("Adding 'flowup_uuid' column to users table...");
            dbInstance.exec('ALTER TABLE users ADD COLUMN flowup_uuid TEXT UNIQUE');
        }

        const messagesCols = dbInstance.prepare("PRAGMA table_info(messages)").all() as { name: string }[];
        if (!messagesCols.some(col => col.name === 'attachment_name')) {
            console.log("Adding 'attachment_name' column to messages table...");
            dbInstance.exec('ALTER TABLE messages ADD COLUMN attachment_name TEXT');
        }
        if (!messagesCols.some(col => col.name === 'edited_timestamp')) {
            console.log("Adding 'edited_timestamp' column to messages table...");
            dbInstance.exec('ALTER TABLE messages ADD COLUMN edited_timestamp TEXT');
        }
        if (!messagesCols.some(col => col.name === 'is_transferred')) {
            console.log("Adding 'is_transferred' column to messages table...");
            dbInstance.exec('ALTER TABLE messages ADD COLUMN is_transferred INTEGER DEFAULT 0');
        }

        const groupsCols = dbInstance.prepare("PRAGMA table_info(groups)").all() as { name:string }[];
        if (!groupsCols.some(col => col.name === 'description')) {
            console.log("Adding 'description' column to groups table...");
            dbInstance.exec('ALTER TABLE groups ADD COLUMN description TEXT');
        }
    } catch (error) {
        if (error instanceof Error && !error.message.includes("no such table")) {
          console.error("Error during database column migration:", error);
        }
    }
}

function getDatabaseConnection(): Database.Database {
    let dbInstance: Database.Database;
    const recreateDb = () => {
        console.error('Database is corrupt or unreadable. Recreating the database file.');
        if (dbInstance && dbInstance.open) {
            dbInstance.close();
        }
        try {
            if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
            if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
            if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
        } catch (e) {
            console.error('Could not delete corrupt database file.', e);
        }
        const newDb = new Database(dbPath);
        applySchemaAndMigrations(newDb);
        return newDb;
    };

    try {
        dbInstance = new Database(dbPath);
        const integrityCheck = dbInstance.pragma('integrity_check', { simple: true });
        if (integrityCheck !== 'ok') {
            console.error(`Database integrity check failed with result: ${integrityCheck}.`);
            return recreateDb();
        }
    } catch (e) {
        return recreateDb();
    }
    
    // Apply schema and migrations to existing valid DB
    applySchemaAndMigrations(dbInstance);

    return dbInstance;
}

let db: Database.Database;

// Use a singleton pattern to avoid re-creating the connection on hot reloads
if (process.env.NODE_ENV === 'production') {
  db = getDatabaseConnection();
} else {
  if (!global.__db) {
    global.__db = getDatabaseConnection();
  }
  db = global.__db;
}

if (db.open) {
    console.log("Database connection is open and ready.");
} else {
    console.error("FATAL: Failed to open database connection.");
}

export { db };
