import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    // Unit tests never touch a real DB/Redis (see lib/token/db-ledger.test.ts
    // - validation runs before any network call), but lib/db/client.ts and
    // lib/db/redis.ts throw at import time if these are unset. Dummy values
    // let `npm test` run without a real .env.local, same as CI.
    env: {
      DATABASE_URL: "postgresql://user:password@localhost/vidnex_test",
      UPSTASH_REDIS_REST_URL: "https://test-placeholder.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "test-placeholder-token",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
});
