import { Scenes, Markup } from "telegraf";
import type { BotContext } from "../context";
import { formatCurrency } from "@trafferbot/shared";
import { notifyAdmins } from "../utils/notify-admins";

export const withdrawalScene = new Scenes.WizardScene<BotContext>(
  "withdrawal",

  // Step 1: Select withdrawal method
  async (ctx) => {
    if (!ctx.dbUser) return ctx.scene.leave();

    if (parseFloat(ctx.dbUser.balance) <= 0) {
      await ctx.reply("❌ У вас нулевой баланс.");
      return ctx.scene.leave();
    }

    const methods = await ctx.services.withdrawals.getMethods(true);
    if (methods.length === 0) {
      await ctx.reply("❌ Нет доступных способов вывода.");
      return ctx.scene.leave();
    }

    const buttons = methods.map((m) => [
      Markup.button.callback(
        `${m.name} (мин. ${formatCurrency(m.minAmount)})`,
        `wm_${m.id}`
      ),
    ]);
    buttons.push([Markup.button.callback("❌ Отмена", "w_cancel")]);

    await ctx.reply(
      `💸 *Вывод средств*\n\nВаш баланс: ${formatCurrency(ctx.dbUser.balance)}\n\nВыберите способ вывода:`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard(buttons),
      }
    );
    return ctx.wizard.next();
  },

  // Step 2: Enter amount
  async (ctx) => {
    if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;

    const data = ctx.callbackQuery.data;
    await ctx.answerCbQuery();

    if (data === "w_cancel") {
      await ctx.reply("❌ Отменено.");
      return ctx.scene.leave();
    }

    const methodId = parseInt(data.replace("wm_", ""), 10);
    if (isNaN(methodId)) return;

    (ctx.wizard.state as Record<string, unknown>).methodId = methodId;

    await ctx.reply("💵 Введите сумму для вывода:");
    return ctx.wizard.next();
  },

  // Step 3: Enter requisites
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("❌ Введите сумму числом.");
      return;
    }
    if (!ctx.dbUser) return;

    const amount = parseFloat(ctx.message.text.trim());
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply("❌ Некорректная сумма. Попробуйте ещё раз:");
      return;
    }

    if (amount > parseFloat(ctx.dbUser.balance)) {
      await ctx.reply(
        `❌ Недостаточно средств. Ваш баланс: ${formatCurrency(ctx.dbUser.balance)}`
      );
      return;
    }

    // Check min amount for method
    const state = ctx.wizard.state as Record<string, unknown>;
    const methods = await ctx.services.withdrawals.getMethods(true);
    const method = methods.find((m) => m.id === state.methodId);
    if (method && amount < parseFloat(method.minAmount)) {
      await ctx.reply(
        `❌ Минимальная сумма для ${method.name}: ${formatCurrency(method.minAmount)}`
      );
      return;
    }

    state.amount = amount.toFixed(2);

    await ctx.reply("📋 Введите реквизиты (кошелёк, номер карты и т.д.):");
    return ctx.wizard.next();
  },

  // Step 4: Confirm and create
  async (ctx) => {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("❌ Введите реквизиты текстом.");
      return;
    }
    if (!ctx.dbUser) return;

    const requisites = ctx.message.text.trim();
    if (requisites.length < 1) {
      await ctx.reply("❌ Реквизиты не могут быть пустыми.");
      return;
    }

    const state = ctx.wizard.state as Record<string, unknown>;

    const withdrawal = await ctx.services.withdrawals.create({
      userId: ctx.dbUser.id,
      methodId: state.methodId as number,
      amount: state.amount as string,
      requisites,
    });

    // Subtract from balance
    await ctx.services.users.updateBalance(
      ctx.dbUser.id,
      state.amount as string,
      "subtract"
    );

    // Notify admins who can process withdrawals
    const name = ctx.dbUser.username ? `@${ctx.dbUser.username}` : ctx.dbUser.firstName;
    const adminUrl = process.env.ADMIN_URL ?? "";
    const adminLink = adminUrl ? `\n\n<a href="${adminUrl}/withdrawals">Открыть в админке</a>` : "";
    await notifyAdmins(
      ctx.services,
      "withdrawals.process",
      `<b>Заявка на вывод #${withdrawal.id}</b>\n\nОт: ${name}\nСумма: ${formatCurrency(state.amount as string)}\nРеквизиты: ${requisites}${adminLink}`
    );

    await ctx.reply(
      `✅ Заявка на вывод #${withdrawal.id} создана!\n\n` +
        `💵 Сумма: ${formatCurrency(state.amount as string)}\n` +
        `📋 Реквизиты: ${requisites}\n\n` +
        `Ожидайте обработки администратором.`
    );
    return ctx.scene.leave();
  }
);

withdrawalScene.action("w_cancel", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("❌ Отменено.");
  return ctx.scene.leave();
});
