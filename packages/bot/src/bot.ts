import { Telegraf, Scenes, session } from "telegraf";
import { createDb } from "@trafferbot/db";
import {
  UserService,
  ApplicationService,
  VideoService,
  WithdrawalService,
  ReferralService,
  SettingsService,
  PlatformService,
  LogService,
  StatsService,
  NotificationService,
} from "@trafferbot/shared";
import type { BotContext, Services } from "./context";
import { authMiddleware } from "./middlewares/auth";
import { registerStartHandler } from "./handlers/start";
import { registerMenuHandlers } from "./handlers/menu";
import { applicationScene } from "./scenes/application";
import { videoSubmitScene } from "./scenes/video-submit";
import { withdrawalScene } from "./scenes/withdrawal";
import { MENU } from "./keyboards/main";

export function createBot(token: string, databaseUrl: string) {
  const db = createDb(databaseUrl);

  const settingsService = new SettingsService(db);
  const services: Services = {
    users: new UserService(db),
    applications: new ApplicationService(db),
    videos: new VideoService(db),
    withdrawals: new WithdrawalService(db),
    referrals: new ReferralService(db, settingsService),
    settings: settingsService,
    platforms: new PlatformService(db),
    logs: new LogService(db),
    stats: new StatsService(db),
    notifications: new NotificationService(db),
  };

  const bot = new Telegraf<BotContext>(token);

  // Stage with all scenes
  const stage = new Scenes.Stage<BotContext>([
    applicationScene,
    videoSubmitScene,
    withdrawalScene,
  ]);

  // Middlewares
  bot.use(session());
  bot.use((ctx, next) => {
    ctx.db = db;
    ctx.services = services;
    return next();
  });
  bot.use(authMiddleware);

  // If user sends a menu button text while in a scene, leave the scene first
  const menuTexts = new Set(Object.values(MENU));
  stage.use(async (ctx, next) => {
    if (
      ctx.scene?.current &&
      ctx.message &&
      "text" in ctx.message &&
      menuTexts.has(ctx.message.text as typeof MENU[keyof typeof MENU])
    ) {
      await ctx.scene.leave();
      // Don't call next() — let the message fall through to bot.hears handlers
      return;
    }
    return next();
  });

  bot.use(stage.middleware());

  // Handlers
  registerStartHandler(bot);
  registerMenuHandlers(bot);

  bot.catch((err: unknown, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
  });

  return bot;
}
