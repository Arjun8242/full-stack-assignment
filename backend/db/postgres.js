import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const buildConfig = () => {
  if (process.env.POSTGRES_URI) {
    return {
      connectionString: process.env.POSTGRES_URI,
      ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
    };
  }

  const requiredVars = ['POSTGRES_HOST', 'POSTGRES_PORT', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'];
  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing PostgreSQL environment variables: ${missing.join(', ')}`);
  }

  return {
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
  };
};

const pool = new Pool(buildConfig());

export const connectPostgres = async () => {
  await pool.query('SELECT 1');
};

export const query = async (text, params = []) => {
  return pool.query(text, params);
};

export const closePostgres = async () => {
  await pool.end();
};
