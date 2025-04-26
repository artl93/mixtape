import pool from './services/db';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  const sqlPath = path.join(__dirname, './init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  try {
    await pool.query(sql);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
