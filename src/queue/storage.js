import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

let db;

// Setup correct file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../queuectl.db');

// Initialize database
export async function init() {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      command TEXT,
      state TEXT,
      attempts INTEGER,
      max_retries INTEGER,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS dlq (
      id TEXT PRIMARY KEY,
      command TEXT,
      state TEXT,
      attempts INTEGER,
      max_retries INTEGER,
      created_at TEXT,
      updated_at TEXT
    )
  `);

  console.log('✅ SQLite database initialized at', dbPath);
}

// Add job
export async function enqueueJob(job) {
  await db.run(
    `INSERT INTO jobs (id, command, state, attempts, max_retries, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      job.id,
      job.command,
      job.state,
      job.attempts,
      job.max_retries,
      job.created_at,
      job.updated_at
    ]
  );
}

// Get jobs
export async function listJobs(state = null) {
  if (state) {
    return db.all(`SELECT * FROM jobs WHERE state = ?`, [state]);
  }
  return db.all(`SELECT * FROM jobs`);
}

// Update job
export async function updateJobState(id, newState, attempts) {
  await db.run(
    `UPDATE jobs SET state = ?, attempts = ?, updated_at = ? WHERE id = ?`,
    [newState, attempts, new Date().toISOString(), id]
  );
}

// Move to DLQ
export async function moveToDLQ(job) {
  await db.run(
    `INSERT OR REPLACE INTO dlq (id, command, state, attempts, max_retries, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      job.id,
      job.command,
      'dead',
      job.attempts,
      job.max_retries,
      job.created_at,
      new Date().toISOString()
    ]
  );
  await db.run(`DELETE FROM jobs WHERE id = ?`, [job.id]);
}

// List DLQ jobs
export async function listDLQ() {
  return db.all(`SELECT * FROM dlq`);
}
