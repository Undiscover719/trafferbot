import type { Telegraf } from "telegraf";
import type { BotContext } from "../context";
import { MENU } from "../keyboards/main";
import { getMemberStatus } from "./start";
import {
  formatCurrency,
  SETTINGS_KEYS,
} from "@trafferbot/shared";
import { t } from "../i18n/index";

async function requireApproved(ctx: BotContext): Promise<boolean> {
  if (!ctx.dbUser) return false;
  const status = await getMemberStatus(ctx);
  if (status !== "approved") {
    await ctx.reply(t("menu.not_member"));
    return false;
  }
  return true;
}

export function registerMenuHandlers(bot: Telegraf<BotContext>) {
  // Submit application
  bot.hears(MENU.APPLICATION, async (ctx) => {
    if (!ctx.dbUser) return;

    const status = await getMemberStatus(ctx);
    if (status === "approved") {
      await ctx.reply(t("menu.already_member"));
      return;
    }
    if (status === "pending") {
      await ctx.reply(t("menu.application_pending"));
      return;
    }

    await ctx.scene.enter("application");
  });

  // Application status
  bot.hears(MENU.APPLICATION_STATUS, async (ctx) => {
    if (!ctx.dbUser) return;

    const pending = await ctx.services.applications.findPendingByUser(ctx.dbUser.id);
    if (pending) {
      await ctx.reply(t("menu.application_status_pending", { id: pending.id }));
      return;
    }

    const approved = await ctx.services.applications.findApprovedByUser(ctx.dbUser.id);
    if (approved) {
      await ctx.reply(t("menu.application_status_approved"));
      return;
    }

    await ctx.reply(t("menu.application_status_none"));
  });

  // Submit video — only approved
  bot.hears(MENU.SUBMIT_VIDEO, async (ctx) => {
    if (!(await requireApproved(ctx))) return;
    await ctx.scene.enter("video-submit");
  });

  // Balance / Withdrawal — only approved
  bot.hears(MENU.BALANCE, async (ctx) => {
    if (!(await requireApproved(ctx))) return;
    if (!ctx.dbUser) return;

    const text = t("menu.balance_text", {
      balance: formatCurrency(ctx.dbUser.balance),
      totalEarned: formatCurrency(ctx.dbUser.totalEarned),
    });

    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: t("menu.balance_withdraw_button"), callback_data: "withdrawal_start" }],
        ],
      },
    });
  });

  bot.action("withdrawal_start", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.scene.enter("withdrawal");
  });

  // Referrals — only approved
  bot.hears(MENU.REFERRALS, async (ctx) => {
    if (!(await requireApproved(ctx))) return;
    if (!ctx.dbUser) return;

    const referrals = await ctx.services.users.getReferrals(ctx.dbUser.id);
    const totalEarned = await ctx.services.referrals.getTotalByReferrer(
      ctx.dbUser.id
    );

    const botInfo = await ctx.telegram.getMe();
    const refLink = `https://t.me/${botInfo.username}?start=ref_${ctx.dbUser.referralCode}`;

    const lines = [
      t("menu.referral_header"),
      "",
      t("menu.referral_link", { link: refLink }),
      t("menu.referral_invited", { count: referrals.length }),
      t("menu.referral_earned", { amount: formatCurrency(totalEarned) }),
    ];

    if (referrals.length > 0) {
      lines.push("", t("menu.referral_list_header"));
      referrals.forEach((ref, i) => {
        lines.push(
          `${i + 1}. ${ref.firstName}${ref.username ? ` (@${ref.username})` : ""}`
        );
      });
    }

    await ctx.reply(lines.join("\n"), { parse_mode: "Markdown" });
  });

  // Statistics — only approved
  bot.hears(MENU.STATS, async (ctx) => {
    if (!(await requireApproved(ctx))) return;
    if (!ctx.dbUser) return;

    const userStats = await ctx.services.stats.getUserStats(ctx.dbUser.id);
    const videoCount = await ctx.services.videos.countByUser(ctx.dbUser.id);

    const text = [
      t("menu.stats_header"),
      "",
      t("menu.stats_videos", { count: videoCount }),
      t("menu.stats_balance", { balance: formatCurrency(ctx.dbUser.balance) }),
      t("menu.stats_total_earned", { totalEarned: formatCurrency(ctx.dbUser.totalEarned) }),
      t("menu.stats_withdrawn", { withdrawn: formatCurrency(userStats.totalWithdrawn) }),
    ].join("\n");

    await ctx.reply(text, { parse_mode: "Markdown" });
  });

  // Leaderboard — only approved
  bot.hears(MENU.LEADERBOARD, async (ctx) => {
    if (!(await requireApproved(ctx))) return;

    const top = await ctx.services.users.getLeaderboard(10);

    if (top.length === 0) {
      await ctx.reply(t("menu.leaderboard_empty"));
      return;
    }

    const medals = ["🥇", "🥈", "🥉"];
    const lines = [t("menu.leaderboard_header"), ""];

    top.forEach((user, i) => {
      const prefix = medals[i] ?? `${i + 1}.`;
      const name = user.username ? `@${user.username}` : user.firstName;
      lines.push(`${prefix} ${name} — ${formatCurrency(user.totalEarned)}`);
    });

    await ctx.reply(lines.join("\n"), { parse_mode: "Markdown" });
  });

  // History — withdrawal + video history
  bot.hears(MENU.HISTORY, async (ctx) => {
    if (!(await requireApproved(ctx))) return;
    if (!ctx.dbUser) return;

    const [withdrawalsList, videosList] = await Promise.all([
      ctx.services.withdrawals.listByUser(ctx.dbUser.id),
      ctx.services.videos.listByUser(ctx.dbUser.id),
    ]);

    const lines = [t("menu.history_header"), ""];

    if (withdrawalsList.length > 0) {
      lines.push(t("menu.history_withdrawals_header"));
      const recent = withdrawalsList.slice(0, 10);
      const statusEmoji: Record<string, string> = {
        pending: "⏳",
        approved: "✅",
        rejected: "❌",
        completed: "💸",
      };
      for (const w of recent) {
        const emoji = statusEmoji[w.status] ?? "❓";
        const date = new Date(w.createdAt).toLocaleDateString("en");
        lines.push(`${emoji} ${formatCurrency(w.amount)} — ${w.method.name} (${date})`);
      }
    } else {
      lines.push(t("menu.history_withdrawals_empty"));
    }

    lines.push("");

    if (videosList.length > 0) {
      lines.push(t("menu.history_videos_header"));
      const recent = videosList.slice(0, 10);
      const statusEmoji: Record<string, string> = {
        pending: "⏳",
        approved: "✅",
        rejected: "❌",
      };
      for (const v of recent) {
        const emoji = statusEmoji[v.status] ?? "❓";
        const date = new Date(v.createdAt).toLocaleDateString("en");
        const earned = v.earnings ? ` +${formatCurrency(v.earnings)}` : "";
        lines.push(`${emoji} ${v.platform.name} (${date})${earned}`);
      }
    } else {
      lines.push(t("menu.history_videos_empty"));
    }

    await ctx.reply(lines.join("\n"), { parse_mode: "Markdown" });
  });

  // Settings — toggle leaderboard visibility
  bot.hears(MENU.SETTINGS, async (ctx) => {
    if (!(await requireApproved(ctx))) return;
    if (!ctx.dbUser) return;

    const hidden = ctx.dbUser.hideFromLeaderboard;
    await ctx.reply(
      `${t("menu.settings_header")}\n\n${hidden ? t("menu.settings_leaderboard_hidden") : t("menu.settings_leaderboard_visible")}`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{
              text: hidden ? t("menu.settings_leaderboard_show_btn") : t("menu.settings_leaderboard_hide_btn"),
              callback_data: "toggle_leaderboard",
            }],
          ],
        },
      }
    );
  });

  bot.action("toggle_leaderboard", async (ctx) => {
    await ctx.answerCbQuery();
    if (!ctx.dbUser) return;

    const newValue = await ctx.services.users.toggleLeaderboardVisibility(ctx.dbUser.id);
    await ctx.editMessageText(
      `${t("menu.settings_header")}\n\n${newValue ? t("menu.settings_leaderboard_hidden") : t("menu.settings_leaderboard_visible")}`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{
              text: newValue ? t("menu.settings_leaderboard_show_btn") : t("menu.settings_leaderboard_hide_btn"),
              callback_data: "toggle_leaderboard",
            }],
          ],
        },
      }
    );
  });

  // Links — available to everyone
  bot.hears(MENU.LINKS, async (ctx) => {
    const links = await ctx.services.settings.get<
      Array<{ name: string; url: string }>
    >(SETTINGS_KEYS.PROJECT_LINKS);

    if (!links || links.length === 0) {
      await ctx.reply(t("menu.links_empty"));
      return;
    }

    const buttons = links.map((link) => [
      { text: link.name, url: link.url },
    ]);

    await ctx.reply(t("menu.links_header"), {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buttons },
    });
  });
}
