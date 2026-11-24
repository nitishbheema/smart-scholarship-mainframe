import fs from 'fs';
import path from 'path';
import { pool } from './db';

export async function runMigrations() {
  const localSchema = path.join(__dirname, 'schema.sql');
  const srcSchema = path.resolve(__dirname, '../../src/database/schema.sql');
  const schemaPath = fs.existsSync(localSchema) ? localSchema : srcSchema;

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at ${schemaPath}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('Running PostgreSQL schema migration...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(schemaSql);
    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
