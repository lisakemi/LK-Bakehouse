import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import dotenv from 'dotenv';

dotenv.config();

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionUri =
      process.env.SUPABASE_DB_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL;

    if (connectionUri) {
      const isLocal = connectionUri.includes('localhost') || connectionUri.includes('127.0.0.1');
      global._postgresPool = new Pool({
        connectionString: connectionUri,
        ssl: isLocal ? false : { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 15000,
      });
      console.log('Connected to PostgreSQL via Connection URI (Supabase / External DB)');
    } else {
      const host = process.env.SUPABASE_DB_HOST || process.env.SQL_HOST;
      const port = Number(process.env.SUPABASE_DB_PORT || process.env.SQL_PORT || 5432);
      const user = process.env.SUPABASE_DB_USER || process.env.SQL_USER;
      const password = process.env.SUPABASE_DB_PASSWORD || process.env.SQL_PASSWORD;
      const database = process.env.SUPABASE_DB_NAME || process.env.SQL_DB_NAME || 'postgres';

      const requiresSsl = Boolean(
        (host && host.includes('supabase.co')) ||
        process.env.PGSSLMODE === 'require' ||
        process.env.SUPABASE_SSL === 'true'
      );

      global._postgresPool = new Pool({
        host,
        port,
        user,
        password,
        database,
        ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
      console.log(`Connected to PostgreSQL on ${host}:${port}/${database}`);
    }

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
