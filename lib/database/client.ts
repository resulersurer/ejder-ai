import "server-only";
import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "./config";

let sql: ReturnType<typeof neon> | undefined;

// Lazy creation keeps builds and the demo UI independent from live credentials.
// Import this module only from authenticated server-side operations.
export function getDatabase() {
  return (sql ??= neon(getDatabaseUrl(), {
    fetchOptions: { cache: "no-store" },
  }));
}
