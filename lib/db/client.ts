import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.",
  );
}

// neon-http: a fetch-based driver, ideal for Vercel's serverless/edge
// functions (no persistent TCP connection to manage). If we later need
// interactive transactions across multiple statements, switch to
// drizzle-orm/neon-serverless (websocket-based) for that call site only.
const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
