import {
  type Database,
  users,
  videos,
  withdrawals,
  applications,
  count,
  sum,
  eq,
  gte,
  sql,
  and,
  ne,
} from "@trafferbot/db";

export class StatsService {
  constructor(private db: Database) {}

  async getDashboardStats() {
    const [
      [totalUsers],
      [pendingApplications],
      [pendingVideos],
      [pendingWithdrawals],
      [totalEarnings],
      [totalWithdrawn],
    ] = await Promise.all([
      this.db.select({ count: count() }).from(users),
      this.db
        .select({ count: count() })
        .from(applications)
        .where(eq(applications.status, "pending")),
      this.db
        .select({ count: count() })
        .from(videos)
        .where(eq(videos.status, "pending")),
      this.db
        .select({ count: count() })
        .from(withdrawals)
        .where(eq(withdrawals.status, "pending")),
      this.db.select({ total: sum(users.totalEarned) }).from(users),
      this.db
        .select({ total: sum(withdrawals.amount) })
        .from(withdrawals)
        .where(eq(withdrawals.status, "completed")),
    ]);

    return {
      totalUsers: totalUsers.count,
      pendingApplications: pendingApplications.count,
      pendingVideos: pendingVideos.count,
      pendingWithdrawals: pendingWithdrawals.count,
      totalEarnings: totalEarnings.total ?? "0",
      totalWithdrawn: totalWithdrawn.total ?? "0",
    };
  }

  async getChartData(days: number = 90) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const dateExpr = sql`DATE(${users.createdAt})`;

    const [usersPerDay, videosPerDay, withdrawalsPerDay] = await Promise.all([
      this.db
        .select({
          date: sql<string>`DATE(${users.createdAt})`.as("date"),
          count: count(),
        })
        .from(users)
        .where(gte(users.createdAt, startDate))
        .groupBy(sql`DATE(${users.createdAt})`)
        .orderBy(sql`DATE(${users.createdAt})`),
      this.db
        .select({
          date: sql<string>`DATE(${videos.createdAt})`.as("date"),
          count: count(),
        })
        .from(videos)
        .where(gte(videos.createdAt, startDate))
        .groupBy(sql`DATE(${videos.createdAt})`)
        .orderBy(sql`DATE(${videos.createdAt})`),
      this.db
        .select({
          date: sql<string>`DATE(${withdrawals.createdAt})`.as("date"),
          count: count(),
        })
        .from(withdrawals)
        .where(gte(withdrawals.createdAt, startDate))
        .groupBy(sql`DATE(${withdrawals.createdAt})`)
        .orderBy(sql`DATE(${withdrawals.createdAt})`),
    ]);

    // Build a map date -> { users, videos, withdrawals }
    const map = new Map<string, { date: string; users: number; videos: number; withdrawals: number }>();

    // Fill all dates in range
    const cursor = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    while (cursor <= today) {
      const key = cursor.toISOString().slice(0, 10);
      map.set(key, { date: key, users: 0, videos: 0, withdrawals: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const row of usersPerDay) {
      const key = typeof row.date === "string" ? row.date.slice(0, 10) : new Date(row.date).toISOString().slice(0, 10);
      const entry = map.get(key);
      if (entry) entry.users = row.count;
    }
    for (const row of videosPerDay) {
      const key = typeof row.date === "string" ? row.date.slice(0, 10) : new Date(row.date).toISOString().slice(0, 10);
      const entry = map.get(key);
      if (entry) entry.videos = row.count;
    }
    for (const row of withdrawalsPerDay) {
      const key = typeof row.date === "string" ? row.date.slice(0, 10) : new Date(row.date).toISOString().slice(0, 10);
      const entry = map.get(key);
      if (entry) entry.withdrawals = row.count;
    }

    return Array.from(map.values());
  }

  async getUserStats(userId: number) {
    const [approvedVideos, pendingVideos, totalWithdrawals] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(videos)
        .where(eq(videos.userId, userId)),
      this.db
        .select({ count: count() })
        .from(videos)
        .where(eq(videos.userId, userId)),
      this.db
        .select({ total: sum(withdrawals.amount) })
        .from(withdrawals)
        .where(eq(withdrawals.userId, userId)),
    ]);

    return {
      videosCount: approvedVideos[0].count,
      totalWithdrawn: totalWithdrawals[0].total ?? "0",
    };
  }
}
