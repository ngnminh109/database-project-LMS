import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "../shared/schema";

// For course submission - MySQL configuration
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please configure your MySQL database connection.",
  );
}

// Create MySQL connection pool
export const pool = mysql.createPool(process.env.DATABASE_URL);
export const db = drizzle({ client: pool, schema, mode: 'default' });