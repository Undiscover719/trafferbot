import type { Telegraf } from "telegraf";
import type { BotContext } from "./context";
import type { NotificationService } from "@trafferbot/shared";

export function startNotificationPoller(
  bot: Telegraf<BotContext>,
  notificationService: NotificationService,
  intervalMs = 3000
) {
  const poll = async () => {
    try {
      const pending = await notificationService.getPending(20);
      for (const n of pending) {
        try {
          await bot.telegram.sendMessage(
            n.chatId.toString(),
            n.message,
            { parse_mode: (n.parseMode as "HTML" | "Markdown") ?? "HTML" }
          );
          await notificationService.markSent(n.id);
        } catch (err) {
          console.error(`Failed to send notification #${n.id}:`, err);
          // Mark as sent to avoid infinite retries on blocked users etc.
          await notificationService.markSent(n.id);
        }
      }
    } catch (err) {
      console.error("Notification poller error:", err);
    }
  };

  const timer = setInterval(poll, intervalMs);
  // Run immediately on start
  poll();

  return () => clearInterval(timer);
}
