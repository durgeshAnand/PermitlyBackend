import {config} from 'dotenv';

const activeEnv = process.env.NODE_ENV ?? 'development';
config({ path: `.env.${activeEnv}.local` });

export const PORT     = process.env.PORT      ?? 3000; // meaning its coming from .env file
export const NODE_ENV = activeEnv;
export const DB_HOST = process.env.DB_HOST ?? 'localhost';
export const DB_PORT = process.env.DB_PORT ?? 5432;
export const DB_NAME = process.env.DB_NAME ?? 'permitly_db';
export const DB_USER = process.env.DB_USER ?? 'postgres';
export const DB_PASSWORD = process.env.DB_PASSWORD;