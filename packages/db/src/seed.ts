import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dirname, "../../../.env") });
import { createDb, platforms, settings } from "./index";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const db = createDb(url);

  console.log("Seeding database...");

  // Default platforms
  await db
    .insert(platforms)
    .values([
      { name: "TikTok", icon: "🎵" },
      { name: "YouTube", icon: "▶️" },
      { name: "Instagram", icon: "📷" },
    ])
    .onConflictDoNothing();

  // Default settings
  const defaultSettings = [
    { key: "referral_percent", value: 5 },
    { key: "welcome_text", value: "Добро пожаловать в TrafferBot! 🎬" },
    {
      key: "rules_text",
      value:
        "1. Загружайте только оригинальный контент\n2. Соблюдайте сроки\n3. Не используйте ботов для накрутки",
    },
    { key: "project_links", value: [] },
  ];

  for (const s of defaultSettings) {
    await db
      .insert(settings)
      .values({ key: s.key, value: s.value })
      .onConflictDoNothing();
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
