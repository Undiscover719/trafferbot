import { Scenes, Markup } from "telegraf";
import type { BotContext } from "../context";
import { notifyAdmins } from "../utils/notify-admins";

export const videoSubmitScene = new Scenes.WizardScene<BotContext>(
  "video-submit",

  // Step 1: Select platform
  async (ctx) => {
    const platforms = await ctx.services.platforms.getAll(true);
    if (platforms.length === 0) {
      await ctx.reply("❌ Нет доступных платформ.");
      return ctx.scene.leave();
    }

    const buttons = platforms.map((p) => [
      Markup.button.callback(
        `${p.icon ?? ""} ${p.name}`,
        `vid_platform_${p.id}`
      ),
    ]);
    buttons.push([Markup.button.callback("❌ Отмена", "vid_cancel")]);

    await ctx.reply(
      "📹 *Подача видео на оценку*\n\nВыберите платформу:",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(buttons),
      }
    );
    return ctx.wizard.next();
  },

  // Step 2: Enter video URL
  async (ctx) => {
    if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;

    const data = ctx.callbackQuery.data;
    await ctx.answerCbQuery();

    if (data === "vid_cancel") {
      await ctx.reply("❌ Отменено.");
      return ctx.scene.leave();
    }

    const platformId = parseInt(data.replace("vid_platform_", ""), 10);
    if (isNaN(platformId)) return;

    (ctx.wizard.state as Record<string, unknown>).platformId = platformId;

    await ctx.reply("🔗 Отправьте ссылку на видео:");
    return ctx.wizard.next();
  },

  // Step 3: URL received → ask for first stats photo
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("❌ Отправьте ссылку текстом.");
      return;
    }

    const url = ctx.message.text.trim();
    try {
      new URL(url);
    } catch {
      await ctx.reply("❌ Некорректная ссылка. Попробуйте ещё раз:");
      return;
    }

    (ctx.wizard.state as Record<string, unknown>).url = url;

    await ctx.reply("📊 Отправьте скриншот статистики видео (фото 1 из 2):");
    return ctx.wizard.next();
  },

  // Step 4: First photo → ask for second
  async (ctx) => {
    if (!ctx.message || !("photo" in ctx.message) || !ctx.message.photo?.length) {
      await ctx.reply("❌ Отправьте фото (не файлом). Скриншот статистики (1 из 2):");
      return;
    }

    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    (ctx.wizard.state as Record<string, unknown>).statsPhoto1 = fileId;

    await ctx.reply("📊 Отправьте второй скриншот статистики (фото 2 из 2):");
    return ctx.wizard.next();
  },

  // Step 5: Second photo → submit
  async (ctx) => {
    if (!ctx.message || !("photo" in ctx.message) || !ctx.message.photo?.length) {
      await ctx.reply("❌ Отправьте фото (не файлом). Скриншот статистики (2 из 2):");
      return;
    }
    if (!ctx.dbUser) return;

    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    const state = ctx.wizard.state as Record<string, unknown>;
    state.statsPhoto2 = fileId;

    const video = await ctx.services.videos.submit({
      userId: ctx.dbUser.id,
      platformId: state.platformId as number,
      url: state.url as string,
      statsPhoto1: state.statsPhoto1 as string,
      statsPhoto2: fileId,
    });

    // Notify admins who can review videos
    const name = ctx.dbUser.username ? `@${ctx.dbUser.username}` : ctx.dbUser.firstName;
    const adminUrl = process.env.ADMIN_URL ?? "";
    const adminLink = adminUrl ? `\n\n<a href="${adminUrl}/videos">Открыть в админке</a>` : "";
    await notifyAdmins(
      ctx.services,
      "videos.review",
      `<b>Новое видео #${video.id}</b>\n\nОт: ${name}\nСсылка: ${state.url as string}${adminLink}`
    );

    await ctx.reply(
      `✅ Видео #${video.id} отправлено на проверку!\n\nВы получите уведомление после рассмотрения.`
    );
    return ctx.scene.leave();
  }
);

videoSubmitScene.action("vid_cancel", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("❌ Отменено.");
  return ctx.scene.leave();
});
