import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('TEST 4: DLQ Listing');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../queuectl.db');

try {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  const dlqJobs = await db.all('SELECT id, state, command FROM dlq');
  
  if (dlqJobs.length === 0) {
    console.log('DLQ is empty.');
  } else {
    console.log(' DLQ Jobs:');
    dlqJobs.forEach(job => {
      console.log(`🪦 ${job.id} | ${job.state} | ${job.command}`);
    });
  }

  console.log('DLQ test completed\n');
} catch (err) {
  console.error('DLQ test failed:', err.message);
}
