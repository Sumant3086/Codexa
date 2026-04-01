// Only load .env when not already set by test runner
if (!process.env.DB_PATH) {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
}
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = (() => {
  const raw = process.env.DB_PATH || '../../data/ajaia.db';
  if (raw === ':memory:') return raw;  // SQLite in-memory for tests
  return path.isAbsolute(raw)
    ? raw
    : path.resolve(__dirname, raw);
})();

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled Document',
    content TEXT NOT NULL DEFAULT '',
    owner_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS document_shares (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    shared_with_id TEXT NOT NULL,
    permission TEXT NOT NULL DEFAULT 'view',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(document_id, shared_with_id),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_id) REFERENCES users(id)
  );
`);

// Seed demo users
function seedUsers() {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('alice@demo.com');
  if (existing) return;

  const users = [
    { id: 'user-alice', email: 'alice@demo.com', name: 'Alice Johnson', password: 'password123' },
    { id: 'user-bob',   email: 'bob@demo.com',   name: 'Bob Smith',    password: 'password123' },
    { id: 'user-carol', email: 'carol@demo.com',  name: 'Carol White',  password: 'password123' },
  ];

  const insert = db.prepare(
    'INSERT OR IGNORE INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)'
  );

  for (const u of users) {
    insert.run(u.id, u.email, u.name, bcrypt.hashSync(u.password, 10));
  }

  // Seed a sample document for Alice
  db.prepare(`
    INSERT OR IGNORE INTO documents (id, title, content, owner_id)
    VALUES (?, ?, ?, ?)
  `).run(
    'doc-welcome',
    'Welcome to Ajaia Docs',
    JSON.stringify({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Welcome to Ajaia Docs' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'This is a sample document. Try editing it!' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Bold text' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'italic' }], text: 'Italic text' }] }] },
        ]},
      ]
    }),
    'user-alice'
  );
}

seedUsers();

module.exports = db;
