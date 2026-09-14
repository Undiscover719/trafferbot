import { Markup } from "telegraf";
import type { UserRole } from "@trafferbot/shared";

export type MemberStatus = "new" | "pending" | "approved";

/**
 * Keyboard button labels.
 *
 * These are the trigger strings used in `bot.hears()` and must exactly match
 * what the user sees on the keyboard. They live here as constants so that
 * handlers and the keyboard definition stay in sync.
 */
export const MENU = {
  APPLICATION: "📝 Apply",
  APPLICATION_STATUS: "📋 Application status",
  SUBMIT_VIDEO: "🎬 Submit video",
  BALANCE: "💰 Balance",
  REFERRALS: "👥 Referrals",
  STATS: "📊 Statistics",
  LEADERBOARD: "🏆 Leaderboard",
  HISTORY: "📜 History",
  SETTINGS: "⚙️ Settings",
  LINKS: "🔗 Links",
} as const;

/**
 * Returns the appropriate reply keyboard based on the user's role and
 * membership status.
 */
export function getMainKeyboard(role: UserRole, status: MemberStatus) {
  // Users who haven't applied yet — show only the apply button
  if (status === "new") {
    return Markup.keyboard([[MENU.APPLICATION], [MENU.LINKS]]).resize();
  }

  // Users whose application is pending — show status check + links
  if (status === "pending") {
    return Markup.keyboard([
      [MENU.APPLICATION_STATUS],
      [MENU.LINKS],
    ]).resize();
  }

  // Approved members — full keyboard
  return Markup.keyboard([
    [MENU.SUBMIT_VIDEO, MENU.BALANCE],
    [MENU.REFERRALS, MENU.STATS],
    [MENU.LEADERBOARD, MENU.HISTORY],
    [MENU.SETTINGS, MENU.LINKS],
  ]).resize();
}
