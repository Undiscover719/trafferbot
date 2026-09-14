import { Scenes, Markup } from "telegraf";
import type { BotContext } from "../context";
import { t } from "../i18n/index";

export const videoSubmitScene = new Scenes.WizardScene<BotContext>(
  "video-submit",

  // Step 0 — select platform
  async (ctx) => {
    if (!ctx.dbUser) return ctx.scene.leave();

    const platforms = await ctx.services.platforms.list();
    if (!platforms.length) {
      await ctx.reply(t("video.no_platforms"));
      return ctx.scene.leave();
    }

    const buttons = platforms.map((p) => [Markup.button.callback(p.name, `vplatform_${p.id}`)]);
    await ctx.reply(t("video.prompt_platform"), Markup.inlineKeyboard(buttons));

    return ctx.wizard.next();
  },

  // Step 1 — receive platform, ask for video file
  async (ctx) => {
    if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) {
      await ctx.reply(t("video.prompt_platform"));
      return;
    }

    const data = ctx.callbackQuery.data;
    if (!data.startsWith("vplatform_")) return;

    const platformId = parseInt(data.replace("vplatform_", ""), 10);
    ctx.scene.session.platformId = platformId;

    await ctx.answerCbQuery();
    await ctx.reply(t("video.prompt_video"));

    return ctx.wizard.next();
  },

  // Step 2 — receive video file or link
  async (ctx) => {
    if (!ctx.message) {
      await ctx.reply(t("video.invalid_video"));
      return;
    }

    // Accept video document or video message
    if ("video" in ctx.message && ctx.message.video) {
      ctx.scene.session.fileId = ctx.message.video.file_id;
    } else if ("document" in ctx.message && ctx.message.document) {
      ctx.scene.session.fileId = ctx.message.document.file_id;
    } else if ("text" in ctx.message && ctx.message.text) {
      // Accept a link as text
      ctx.scene.session.link = ctx.message.text;
    } else {
      await ctx.reply(t("video.invalid_video"));
      return;
    }

    await ctx.reply(
      t("video.prompt_comment"),
      Markup.keyboard([[t("video.skip_button")]]).oneTime().resize()
    );

    return ctx.wizard.next();
  },

  // Step 3 — receive comment (or skip), submit video
  async (ctx) => {
    if (!ctx.dbUser) return ctx.scene.leave();
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply(t("video.prompt_comment"));
      return;
    }

    const comment =
      ctx.message.text === t("video.skip_button") ? null : ctx.message.text;

    try {
      const video = await ctx.services.videos.create({
        userId: ctx.dbUser.id,
        platformId: ctx.scene.session.platformId,
        fileId: ctx.scene.session.fileId ?? null,
        link: ctx.scene.session.link ?? null,
        comment,
      });

      const platform = await ctx.services.platforms.getById(video.platformId);

      await ctx.reply(
        t("video.submitted", {
          id: video.id,
          platform: platform?.name ?? String(video.platformId),
        }),
        { reply_markup: { remove_keyboard: true } }
      );
    } catch {
      await ctx.reply(t("video.error"), {
        reply_markup: { remove_keyboard: true },
      });
    }

    return ctx.scene.leave();
  }
);

videoSubmitScene.command("cancel", async (ctx) => {
  await ctx.reply(t("video.cancelled"), {
    reply_markup: { remove_keyboard: true },
  });
  return ctx.scene.leave();
});
