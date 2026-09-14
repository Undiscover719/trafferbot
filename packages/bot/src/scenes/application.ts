import { Scenes, Markup } from "telegraf";
import type { BotContext } from "../context";
import { t } from "../i18n/index";

export const applicationScene = new Scenes.WizardScene<BotContext>(
  "application",

  // Step 0 — select platform
  async (ctx) => {
    if (!ctx.dbUser) return ctx.scene.leave();

    // Guard: already pending or approved
    const pending = await ctx.services.applications.findPendingByUser(ctx.dbUser.id);
    if (pending) {
      await ctx.reply(t("application.already_pending"));
      return ctx.scene.leave();
    }
    const approved = await ctx.services.applications.findApprovedByUser(ctx.dbUser.id);
    if (approved) {
      await ctx.reply(t("application.already_approved"));
      return ctx.scene.leave();
    }

    const platforms = await ctx.services.platforms.list();
    if (!platforms.length) {
      await ctx.reply(t("application.no_platforms"));
      return ctx.scene.leave();
    }

    const buttons = platforms.map((p) => [Markup.button.callback(p.name, `platform_${p.id}`)]);
    await ctx.reply(t("application.prompt_platform"), Markup.inlineKeyboard(buttons));

    return ctx.wizard.next();
  },

  // Step 1 — receive platform selection, ask for links
  async (ctx) => {
    if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) {
      await ctx.reply(t("application.prompt_platform"));
      return;
    }

    const data = ctx.callbackQuery.data;
    if (!data.startsWith("platform_")) return;

    const platformId = parseInt(data.replace("platform_", ""), 10);
    ctx.scene.session.platformId = platformId;

    await ctx.answerCbQuery();
    await ctx.reply(t("application.prompt_links"));

    return ctx.wizard.next();
  },

  // Step 2 — receive links, ask for comment
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply(t("application.prompt_links"));
      return;
    }

    ctx.scene.session.links = ctx.message.text;
    await ctx.reply(
      t("application.prompt_comment"),
      Markup.keyboard([[t("application.skip_button")]]).oneTime().resize()
    );

    return ctx.wizard.next();
  },

  // Step 3 — receive comment (or skip), submit application
  async (ctx) => {
    if (!ctx.dbUser) return ctx.scene.leave();
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply(t("application.prompt_comment"));
      return;
    }

    const comment =
      ctx.message.text === t("application.skip_button") ? null : ctx.message.text;

    try {
      const application = await ctx.services.applications.create({
        userId: ctx.dbUser.id,
        platformId: ctx.scene.session.platformId,
        links: ctx.scene.session.links,
        comment,
      });

      const platform = await ctx.services.platforms.getById(application.platformId);

      await ctx.reply(
        t("application.submitted", {
          id: application.id,
          platform: platform?.name ?? String(application.platformId),
        }),
        { reply_markup: { remove_keyboard: true } }
      );
    } catch {
      await ctx.reply(t("application.error"), {
        reply_markup: { remove_keyboard: true },
      });
    }

    return ctx.scene.leave();
  }
);

// Allow cancellation at any step
applicationScene.command("cancel", async (ctx) => {
  await ctx.reply(t("application.cancelled"), {
    reply_markup: { remove_keyboard: true },
  });
  return ctx.scene.leave();
});
