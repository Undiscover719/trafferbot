import "dotenv/config";
import { createBot } from "./bot.js";
import { createDb } from "@trafferbot/db";
import { NotificationService, SettingsService } from "@trafferbot/shared";
import { startNotificationPoller } from "./notification-poller.js";
import { loadPermissions } from "@trafferbot/shared";
import { preloadLocales } from "./i18n/index.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is not set");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

// Pre-load i18n locale files before bot starts
preloadLocales(["en"]);

const db = createDb(DATABASE_URL);
const bot = createBot(BOT_TOKEN, DATABASE_URL);

const notificationService = new NotificationService(db);
const settingsService = new SettingsService(db);

// Load role permissions from DB settings
loadPermissions(settingsService).catch((err) => {
  console.warn("⚠️ Could not load permissions from DB:", err);
});

// Start notification poller
startNotificationPoller(bot, notificationService);

bot
  .launch()
  .then(() => {
    console.log("🤖 Bot launched successfully");
  })
  .catch((err) => {
    console.error("❌ Failed to launch bot:", err);
    process.exit(1);
  });

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
