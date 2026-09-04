import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dirname, "../../../.env") });
import { createBot } from "./bot";
import { startNotificationPoller } from "./notification-poller";
import { NotificationService, SettingsService, SETTINGS_KEYS, loadPermissions } from "@trafferbot/shared";
import { createDb } from "@trafferbot/db";

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN is not set");
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const bot = createBot(token, databaseUrl);

const db = createDb(databaseUrl);
const notificationService = new NotificationService(db);
const settingsService = new SettingsService(db);
const stopPoller = startNotificationPoller(bot, notificationService);

// Load permissions from DB, then start bot
(async () => {
  const dbPerms = await settingsService.get<Record<string, string[]>>(SETTINGS_KEYS.ROLE_PERMISSIONS);
  if (dbPerms) loadPermissions(dbPerms);

  bot.launch(() => {
    console.log("Bot started");
  });
})();

process.once("SIGINT", () => { stopPoller(); bot.stop("SIGINT"); });
process.once("SIGTERM", () => { stopPoller(); bot.stop("SIGTERM"); });
