import { Markup } from "telegraf";
import { type UserRole } from "@trafferbot/shared";

export const MENU = {
  SUBMIT_VIDEO: "📹 Подать видео",
  APPLICATION: "📝 Подать заявку",
  APPLICATION_STATUS: "📋 Статус заявки",
  BALANCE: "💰 Баланс / Вывод",
  REFERRALS: "👥 Рефералы",
  STATS: "📊 Статистика",
  LEADERBOARD: "🏆 Лидерборд",
  LINKS: "🔗 Ссылки",
  SETTINGS: "⚙️ Настройки",
  HISTORY: "📜 История",
} as const;

export type MemberStatus = "new" | "pending" | "approved";

export function getMainKeyboard(role: UserRole, memberStatus: MemberStatus): ReturnType<typeof Markup.keyboard> {
  const rows: string[][] = [];

  if (memberStatus === "approved") {
    rows.push([MENU.SUBMIT_VIDEO, MENU.BALANCE]);
    rows.push([MENU.REFERRALS, MENU.STATS]);
    rows.push([MENU.LEADERBOARD, MENU.HISTORY]);
    rows.push([MENU.SETTINGS, MENU.LINKS]);
  } else if (memberStatus === "pending") {
    rows.push([MENU.APPLICATION_STATUS]);
    rows.push([MENU.LINKS]);
  } else {
    // new — no application yet
    rows.push([MENU.APPLICATION]);
    rows.push([MENU.LINKS]);
  }

  return Markup.keyboard(rows).resize();
}
