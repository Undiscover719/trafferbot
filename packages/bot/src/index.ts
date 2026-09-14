import "dotenv/config";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

// Load .env from the monorepo root (three levels up from packages/bot/src/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../../../.env") });

// ---------------------------------------------------------------------------
// Step 1 — Validate required environment variables
// ---------------------------------------------------------------------------
const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

if (!BOT_TOKEN) {
  console.error("[startup] BOT_TOKEN is not set. Exiting.");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("[startup] DATABASE_URL is not set. Exiting.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Step 2 — Load locale (MUST happen before any handler / scene code runs)
// ---------------------------------------------------------------------------
import { loadLocale } from "./i18n/index.js";

// Reads BOT_LOCALE env var; falls back to "en" if the file is absent.
loadLocale();

// ---------------------------------------------------------------------------
// Step 3 — Initialise the bot (registers middleware, handlers, scenes)
// ---------------------------------------------------------------------------
import { createBot } from "./bot.js";

const bot = createBot(BOT_TOKEN, DATABASE_URL);

// ---------------------------------------------------------------------------
// Step 4 — Shared services used outside the bot context
// ---------------------------------------------------------------------------
import { createDb } from "@trafferbot/db";
import { NotificationService, SettingsService } from "@trafferbot/shared";

const db = createDb(DATABASE_URL);
const notificationService = new NotificationService(db);
const settingsService = new SettingsService(db);

// ---------------------------------------------------------------------------
// Step 5 — Load role permissions from the database
// ---------------------------------------------------------------------------
import { loadPermissions, SETTINGS_KEYS } from "@trafferbot/shared";

try {
  const storedPerms = await settingsService.get<Record<string, string[]>>(
    SETTINGS_KEYS.ROLE_PERMISSIONS
  );
  if (storedPerms) {
    loadPermissions(storedPerms);
    console.log("[startup] Role permissions loaded.");
  } else {
    console.warn("[startup] No role permissions found in settings — using defaults.");
  }
} catch (err) {
  console.error("[startup] Failed to load role permissions:", err);
}

// ---------------------------------------------------------------------------
// Step 6 — Start the notification poller
// ---------------------------------------------------------------------------
import { startNotificationPoller } from "./notification-poller.js";

startNotificationPoller(bot.telegram, notificationService);
console.log("[startup] Notification poller started.");

// ---------------------------------------------------------------------------
// Step 7 — Launch the bot
// ---------------------------------------------------------------------------
await bot.launch({
  dropPendingUpdates: true,
});

console.log("[startup] Bot is running.");

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
