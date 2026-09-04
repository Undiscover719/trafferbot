import { eq } from "@trafferbot/db";
import { users } from "@trafferbot/db";
import type { BotContext } from "../context";

export async function authMiddleware(
  ctx: BotContext,
  next: () => Promise<void>
) {
  if (!ctx.from) return;

  const user = await ctx.services.users.findOrCreate({
    telegramId: BigInt(ctx.from.id),
    username: ctx.from.username,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
  });

  if (user.isBanned) {
    await ctx.reply("⛔ Ваш аккаунт заблокирован.");
    return;
  }

  // Auto-promote owner from env
  const ownerTgId = process.env.OWNER_TELEGRAM_ID;
  if (ownerTgId && String(user.telegramId) === ownerTgId && user.role !== "owner") {
    await ctx.db
      .update(users)
      .set({ role: "owner" })
      .where(eq(users.id, user.id));
    user.role = "owner";
  }

  ctx.dbUser = user;
  return next();
}
