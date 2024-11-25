const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../app.db'), { verbose: console.log });

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT
  )
`).run();

module.exports = db;
