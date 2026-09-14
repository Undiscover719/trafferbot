import type { Telegraf } from "telegraf";
import type { BotContext } from "../context";
import { getMainKeyboard, type MemberStatus } from "../keyboards/main";
import { ADMIN_ROLES, SETTINGS_KEYS, type UserRole } from "@trafferbot/shared";
import { t } from "../i18n/index";

export async function getMemberStatus(ctx: BotContext): Promise<MemberStatus> {
  if (!ctx.dbUser) return "new";

  // Admins/owners always have full access without application
  if (ADMIN_ROLES.includes(ctx.dbUser.role as UserRole)) return "approved";

  const approved = await ctx.services.applications.findApprovedByUser(ctx.dbUser.id);
  if (approved) return "approved";
  const pending = await ctx.services.applications.findPendingByUser(ctx.dbUser.id);
  if (pending) return "pending";
  return "new";
}

export function registerStartHandler(bot: Telegraf<BotContext>) {
  bot.start(async (ctx) => {
    if (!ctx.dbUser) return;

    // Handle referral deep link: /start ref_CODE
    const payload = ctx.startPayload;
    if (payload?.startsWith("ref_")) {
      const refCode = payload.slice(4);
      if (refCode && !ctx.dbUser.referrerId) {
        await ctx.services.users.findOrCreate({
          telegramId: BigInt(ctx.from.id),
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name,
          referrerCode: refCode,
        });
      }
    }

    const welcomeText = await ctx.services.settings.get<string>(
      SETTINGS_KEYS.WELCOME_TEXT
    );
    const status = await getMemberStatus(ctx);

    let text = welcomeText || t("start.welcome_default");
    if (status === "new") {
      text += t("start.new_hint");
    } else if (status === "pending") {
      text += t("start.pending_hint");
    }

    await ctx.reply(
      text,
      getMainKeyboard(ctx.dbUser.role as UserRole, status)
    );
  });
}
