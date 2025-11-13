// src/queue/storage.js
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import defaultCfg from './config.js';

const cwd = process.cwd();
const DB_PATH = process.env.QUEUECTL_DB || defaultCfg.dbPath;
const db = new Database(DB_PATH, { verbose: null });

export function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      command TEXT NOT NULL,
      state TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_retries INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      next_run TEXT NOT NULL,
      last_error TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const insert = db.prepare('INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)');
  insert.run('backoffBase', String(defaultCfg.backoffBase));
  insert.run('defaultMaxRetries', String(defaultCfg.defaultMaxRetries));
  insert.run('jobTimeoutSeconds', String(defaultCfg.jobTimeoutSeconds));
}

export function getConfig(key) {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
  return row ? row.value : null;
}

export function setConfig(key, value) {
  db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run(key, String(value));
}

export function enqueueJob(job) {
  const now = new Date().toISOString();
  const maxRetries = job.max_retries != null ? job.max_retries : parseInt(getConfig('defaultMaxRetries') || defaultCfg.defaultMaxRetries, 10);
  const stmt = db.prepare(`
    INSERT INTO jobs (id, command, state, attempts, max_retries, created_at, updated_at, next_run)
    VALUES (?, ?, 'pending', 0, ?, ?, ?, ?)
  `);
  stmt.run(job.id, job.command, maxRetries, now, now, now);
}

export function listJobs(state = null) {
  if (state) {
    return db.prepare('SELECT * FROM jobs WHERE state = ? ORDER BY created_at').all(state);
  }
  return db.prepare('SELECT * FROM jobs ORDER BY created_at').all();
}

export function getJob(id) {
  return db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
}

export function retryDLQ(id) {
  const job = getJob(id);
  if (!job) throw new Error('job not found');
  if (job.state !== 'dead') throw new Error('job is not in DLQ');
  const now = new Date().toISOString();
  db.prepare('UPDATE jobs SET state = ?, attempts = 0, next_run = ?, updated_at = ?, last_error = NULL WHERE id = ?')
    .run('pending', now, now, id);
}

// Claim job: atomic transaction selects a pending job whose next_run <= now and moves to processing.
// returns the job row or null
export function claimJobReady() {
  const nowIso = new Date().toISOString();
  const txn = db.transaction(() => {
    const row = db.prepare(`
      SELECT * FROM jobs
      WHERE state = 'pending' AND datetime(next_run) <= datetime(?)
      ORDER BY created_at
      LIMIT 1
    `).get(nowIso);
    if (!row) return null;
    const upd = db.prepare('UPDATE jobs SET state = ?, updated_at = ? WHERE id = ? AND state = ?')
      .run('processing', new Date().toISOString(), row.id, 'pending');
    if (upd.changes === 0) return null;
    return db.prepare('SELECT * FROM jobs WHERE id = ?').get(row.id);
  });
  return txn();
}

export function markCompleted(id) {
  db.prepare('UPDATE jobs SET state = ?, updated_at = ? WHERE id = ?')
    .run('completed', new Date().toISOString(), id);
}

export function markFailedScheduleRetry(id, attempts, maxRetries, errorText, backoffBase) {
  const curAttempts = Number(attempts) + 1;
  const now = new Date();
  if (curAttempts > Number(maxRetries)) {
    db.prepare('UPDATE jobs SET state = ?, attempts = ?, last_error = ?, updated_at = ? WHERE id = ?')
      .run('dead', curAttempts, errorText, now.toISOString(), id);
  } else {
    const delaySeconds = Math.pow(Number(backoffBase), curAttempts);
    const nextRun = new Date(now.getTime() + delaySeconds * 1000).toISOString();
    db.prepare('UPDATE jobs SET state = ?, attempts = ?, last_error = ?, next_run = ?, updated_at = ? WHERE id = ?')
      .run('pending', curAttempts, errorText, nextRun, now.toISOString(), id);
  }
}
