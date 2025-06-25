
import Database from 'better-sqlite3';
import path from 'path';

// Define the global variable for caching the database connection
declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

const dbPath = path.join(process.cwd(), 'chat.db');

// Schema definition function
const createSchema = (db: Database.Database) => {
  console.log("Initializing database schema...");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      phone TEXT,
      status TEXT,
      description TEXT,
      profilePic TEXT
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
  console.log("Database schema initialized.");
};

// Function to initialize the database connection
function initializeDb() {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Always run createSchema. It uses "IF NOT EXISTS", so it's safe for existing DBs.
  // This ensures all tables are created if they are missing.
  createSchema(db);

  // Then, run column migrations for older databases.
  try {
    const usersCols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
    if (!usersCols.some(col => col.name === 'description')) {
        console.log("Adding 'description' column to users table...");
        db.exec('ALTER TABLE users ADD COLUMN description TEXT');
    }

    const messagesCols = db.prepare("PRAGMA table_info(messages)").all() as { name: string }[];
    if (!messagesCols.some(col => col.name === 'attachment_name')) {
        console.log("Adding 'attachment_name' column to messages table...");
        db.exec('ALTER TABLE messages ADD COLUMN attachment_name TEXT');
    }
    if (!messagesCols.some(col => col.name === 'edited_timestamp')) {
        console.log("Adding 'edited_timestamp' column to messages table...");
        db.exec('ALTER TABLE messages ADD COLUMN edited_timestamp TEXT');
    }
    if (!messagesCols.some(col => col.name === 'is_transferred')) {
        console.log("Adding 'is_transferred' column to messages table...");
        db.exec('ALTER TABLE messages ADD COLUMN is_transferred INTEGER DEFAULT 0');
    }

    const groupsCols = db.prepare("PRAGMA table_info(groups)").all() as { name: string }[];
    if (!groupsCols.some(col => col.name === 'description')) {
        console.log("Adding 'description' column to groups table...");
        db.exec('ALTER TABLE groups ADD COLUMN description TEXT');
    }
  } catch (error) {
    console.error("Error during database column migration:", error);
    // If migrations fail, it's not critical, but we should log it.
    // The app might still work if the columns are not strictly required everywhere.
  }

  return db;
}


let db: Database.Database;

// Use a singleton pattern to avoid re-creating the connection on hot reloads
if (process.env.NODE_ENV === 'production') {
  db = initializeDb();
} else {
  if (!global.__db) {
    global.__db = initializeDb();
  }
  db = global.__db;
}

export { db };
