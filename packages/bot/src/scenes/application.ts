import { Scenes, Markup } from "telegraf";
import type { BotContext } from "../context";
import { getMainKeyboard } from "../keyboards/main";
import { getMemberStatus } from "../handlers/start";
import { type UserRole } from "@trafferbot/shared";
import { notifyAdmins } from "../utils/notify-admins";

export const applicationScene = new Scenes.WizardScene<BotContext>(
  "application",

  // Step 1: Select platform
  async (ctx) => {
    const platforms = await ctx.services.platforms.getAll(true);
    if (platforms.length === 0) {
      await ctx.reply("❌ Нет доступных платформ. Попробуйте позже.");
      return ctx.scene.leave();
    }

    const buttons = platforms.map((p) => [
      Markup.button.callback(`${p.icon ?? ""} ${p.name}`, `platform_${p.id}`),
    ]);
    buttons.push([Markup.button.callback("❌ Отмена", "cancel")]);

    await ctx.reply(
      "📝 *Подача заявки на вступление*\n\nВыберите платформу, на которой вы работаете:",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(buttons),
      }
    );
    return ctx.wizard.next();
  },

  // Step 2: Enter channel URL
  async (ctx) => {
    if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;

    const data = ctx.callbackQuery.data;
    await ctx.answerCbQuery();

    if (data === "cancel") {
      await ctx.reply("❌ Заявка отменена.");
      return ctx.scene.leave();
    }

    const platformId = parseInt(data.replace("platform_", ""), 10);
    if (isNaN(platformId)) return;

    (ctx.wizard.state as Record<string, unknown>).platformId = platformId;

    await ctx.reply("🔗 Отправьте ссылку на ваш канал/профиль:");
    return ctx.wizard.next();
  },

  // Step 3: Channel URL → ask about self
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("❌ Пожалуйста, отправьте ссылку текстом.");
      return;
    }

    const url = ctx.message.text.trim();
    try {
      new URL(url);
    } catch {
      await ctx.reply("❌ Некорректная ссылка. Попробуйте ещё раз:");
      return;
    }

    (ctx.wizard.state as Record<string, unknown>).channelUrl = url;

    await ctx.reply(
      "👤 Расскажите о себе: какой у вас опыт в создании контента, сколько работаете в сфере?"
    );
    return ctx.wizard.next();
  },

  // Step 4: About self → ask referral source
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("❌ Пожалуйста, ответьте текстом.");
      return;
    }

    (ctx.wizard.state as Record<string, unknown>).aboutSelf = ctx.message.text.trim();

    await ctx.reply(
      "📢 Откуда вы узнали о нашем проекте?"
    );
    return ctx.wizard.next();
  },

  // Step 5: Referral source → optional comment
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("❌ Пожалуйста, ответьте текстом.");
      return;
    }

    (ctx.wizard.state as Record<string, unknown>).referralSource = ctx.message.text.trim();

    await ctx.reply(
      "💬 Хотите добавить что-то ещё? (или отправьте /skip)"
    );
    return ctx.wizard.next();
  },

  // Step 6: Confirm and submit
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) return;
    if (!ctx.dbUser) return;

    const state = ctx.wizard.state as Record<string, unknown>;
    const comment = ctx.message.text === "/skip" ? undefined : ctx.message.text;

    const app = await ctx.services.applications.create({
      userId: ctx.dbUser.id,
      platformId: state.platformId as number,
      channelUrl: state.channelUrl as string,
      aboutSelf: state.aboutSelf as string,
      referralSource: state.referralSource as string,
      comment,
    });

    // Notify admins who can review applications
    const name = ctx.dbUser.username ? `@${ctx.dbUser.username}` : ctx.dbUser.firstName;
    const adminUrl = process.env.ADMIN_URL ?? "";
    const adminLink = adminUrl ? `\n\n<a href="${adminUrl}/applications">Открыть в админке</a>` : "";
    await notifyAdmins(
      ctx.services,
      "applications.review",
      `<b>Новая заявка #${app.id}</b>\n\nОт: ${name}\nКанал: ${state.channelUrl as string}${adminLink}`
    );

    const status = await getMemberStatus(ctx);
    await ctx.reply(
      `✅ Заявка #${app.id} отправлена!\n\n⏳ Ожидайте рассмотрения администратором.`,
      getMainKeyboard(ctx.dbUser.role as UserRole, status)
    );
    return ctx.scene.leave();
  }
);

applicationScene.action("cancel", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("❌ Заявка отменена.");
  return ctx.scene.leave();
});
