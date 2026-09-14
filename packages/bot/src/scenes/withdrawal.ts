import { Scenes, Markup } from "telegraf";
import type { BotContext } from "../context";
import { formatCurrency } from "@trafferbot/shared";
import { t } from "../i18n/index";

export const withdrawalScene = new Scenes.WizardScene<BotContext>(
  "withdrawal",

  // Step 0 — select withdrawal method
  async (ctx) => {
    if (!ctx.dbUser) return ctx.scene.leave();

    const methods = await ctx.services.withdrawals.listMethods();
    if (!methods.length) {
      await ctx.reply(t("withdrawal.no_methods"));
      return ctx.scene.leave();
    }

    const buttons = methods.map((m) => [
      Markup.button.callback(m.name, `wmethod_${m.id}`),
    ]);
    await ctx.reply(t("withdrawal.prompt_method"), Markup.inlineKeyboard(buttons));

    return ctx.wizard.next();
  },

  // Step 1 — receive method, ask for amount
  async (ctx) => {
    if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) {
      await ctx.reply(t("withdrawal.prompt_method"));
      return;
    }

    const data = ctx.callbackQuery.data;
    if (!data.startsWith("wmethod_")) return;

    const methodId = parseInt(data.replace("wmethod_", ""), 10);
    ctx.scene.session.methodId = methodId;

    await ctx.answerCbQuery();

    const balance = ctx.dbUser?.balance ?? 0;
    await ctx.reply(
      t("withdrawal.prompt_amount", { balance: formatCurrency(balance) })
    );

    return ctx.wizard.next();
  },

  // Step 2 — receive amount, ask for payment details
  async (ctx) => {
    if (!ctx.dbUser) return ctx.scene.leave();
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply(t("withdrawal.invalid_amount"));
      return;
    }

    const amount = parseFloat(ctx.message.text.replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply(t("withdrawal.invalid_amount"));
      return;
    }

    const minAmount = 1; // TODO: pull from settings
    if (amount < minAmount) {
      await ctx.reply(t("withdrawal.min_amount", { min: formatCurrency(minAmount) }));
      return;
    }

    if (amount > (ctx.dbUser.balance ?? 0)) {
      await ctx.reply(
        t("withdrawal.insufficient_balance", {
          balance: formatCurrency(ctx.dbUser.balance ?? 0),
        })
      );
      return;
    }

    ctx.scene.session.amount = amount;
    await ctx.reply(t("withdrawal.prompt_details"));

    return ctx.wizard.next();
  },

  // Step 3 — receive details, create withdrawal request
  async (ctx) => {
    if (!ctx.dbUser) return ctx.scene.leave();
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply(t("withdrawal.prompt_details"));
      return;
    }

    const details = ctx.message.text;

    try {
      const methods = await ctx.services.withdrawals.listMethods();
      const method = methods.find((m) => m.id === ctx.scene.session.methodId);

      const withdrawal = await ctx.services.withdrawals.create({
        userId: ctx.dbUser.id,
        methodId: ctx.scene.session.methodId,
        amount: ctx.scene.session.amount,
        details,
      });

      await ctx.reply(
        t("withdrawal.submitted", {
          amount: formatCurrency(withdrawal.amount),
          method: method?.name ?? String(ctx.scene.session.methodId),
          details,
        }),
        { reply_markup: { remove_keyboard: true } }
      );
    } catch {
      await ctx.reply(t("withdrawal.error"), {
        reply_markup: { remove_keyboard: true },
      });
    }

    return ctx.scene.leave();
  }
);

withdrawalScene.command("cancel", async (ctx) => {
  await ctx.reply(t("withdrawal.cancelled"), {
    reply_markup: { remove_keyboard: true },
  });
  return ctx.scene.leave();
});
