import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../queuectl.db');

const viewDb = async () => {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  console.log('Jobs Table:');
  console.table(await db.all('SELECT * FROM jobs'));

  console.log('\n DLQ Table:');
  console.table(await db.all('SELECT * FROM dlq'));
};

viewDb();
