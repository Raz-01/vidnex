// Grants admin access to an existing user, by email. There is deliberately
// no in-app "make admin" button - this is the only way to create one, run
// directly against the database by whoever holds DATABASE_URL.
//
// Usage: npm run admin:promote -- you@email.com
import { neon } from "@neondatabase/serverless";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run admin:promote -- <email>");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set - run this with `npm run admin:promote -- <email>` (loads .env.local).");
  process.exit(1);
}

const sql = neon(connectionString);

const [user] = await sql`select id, email, is_admin from users where email = ${email}`;
if (!user) {
  console.error(`No user found with email ${email} - they need to sign in at least once first.`);
  process.exit(1);
}

if (user.is_admin) {
  console.log(`${email} is already an admin.`);
  process.exit(0);
}

await sql`update users set is_admin = true, updated_at = now() where id = ${user.id}`;
console.log(`${email} is now an admin.`);
