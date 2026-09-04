import { config } from "dotenv";
import { resolve } from "path";

// drizzle-kit runs in CJS, so use __dirname
config({ path: resolve(__dirname, "../../.env") });

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
