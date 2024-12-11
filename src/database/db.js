const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../app.db'), { verbose: console.log });

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    planType TEXT,
    cardHolderName TEXT,
    cardNumber TEXT,
    expiryDate TEXT,
    cvv TEXT,
    admin BOOLEAN DEFAULT false
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_name TEXT NOT NULL,
    days_per_week INTEGER NOT NULL,
    duration TEXT NOT NULL,
    level TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER NOT NULL,
    exercise_name TEXT NOT NULL,
    FOREIGN KEY (workout_id) REFERENCES workouts (id)
  )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS user_workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      workout_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (workout_id) REFERENCES workouts(id)
    )
  `).run();

module.exports = db;
