import {
  type Database,
  notifications,
  eq,
  asc,
} from "@trafferbot/db";

export class NotificationService {
  constructor(private db: Database) {}

  async enqueue(chatId: bigint, message: string, parseMode: string = "HTML") {
    await this.db.insert(notifications).values({ chatId, message, parseMode });
  }

  async getPending(limit = 50) {
    return this.db.query.notifications.findMany({
      where: eq(notifications.sent, false),
      orderBy: asc(notifications.createdAt),
      limit,
    });
  }

  async markSent(id: number) {
    await this.db
      .update(notifications)
      .set({ sent: true })
      .where(eq(notifications.id, id));
  }
}
