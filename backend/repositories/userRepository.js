import { query } from '../db/postgres.js';

export const initializeUsersTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const mapUser = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export const createUser = async ({ name, email, passwordHash }) => {
  const result = await query(
    `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, password_hash, created_at, updated_at
    `,
    [name, email, passwordHash]
  );

  return mapUser(result.rows[0]);
};

export const findUserByEmail = async (email) => {
  const result = await query(
    `
      SELECT id, name, email, password_hash, created_at, updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email]
  );

  return mapUser(result.rows[0]);
};

export const findUserById = async (id) => {
  const result = await query(
    `
      SELECT id, name, email, password_hash, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return mapUser(result.rows[0]);
};
