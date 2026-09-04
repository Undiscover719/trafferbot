import {
  type Database,
  users,
  eq,
  like,
  desc,
  count,
  sql,
  and,
  or,
  inArray,
} from "@trafferbot/db";
import { nanoid } from "../utils";

export class UserService {
  constructor(private db: Database) {}

  async findByTelegramId(telegramId: bigint) {
    return this.db.query.users.findFirst({
      where: eq(users.telegramId, telegramId),
    });
  }

  async findById(id: number) {
    return this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async findOrCreate(data: {
    telegramId: bigint;
    username?: string | null;
    firstName: string;
    lastName?: string | null;
    referrerCode?: string;
  }) {
    const existing = await this.findByTelegramId(data.telegramId);
    if (existing) {
      // Update username/names if changed
      await this.db
        .update(users)
        .set({
          username: data.username ?? undefined,
          firstName: data.firstName,
          lastName: data.lastName ?? undefined,
        })
        .where(eq(users.id, existing.id));
      return existing;
    }

    let referrerId: number | undefined;
    if (data.referrerCode) {
      const referrer = await this.db.query.users.findFirst({
        where: eq(users.referralCode, data.referrerCode),
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    const [user] = await this.db
      .insert(users)
      .values({
        telegramId: data.telegramId,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        referrerId,
        referralCode: nanoid(8),
      })
      .returning();

    return user;
  }

  async list(params: { page: number; limit: number; search?: string }) {
    const offset = (params.page - 1) * params.limit;
    const where = params.search
      ? or(
          like(users.username, `%${params.search}%`),
          like(users.firstName, `%${params.search}%`)
        )
      : undefined;

    const [items, [total]] = await Promise.all([
      this.db.query.users.findMany({
        where,
        limit: params.limit,
        offset,
        orderBy: desc(users.createdAt),
      }),
      this.db.select({ count: count() }).from(users).where(where),
    ]);

    return { items, total: total.count, page: params.page, limit: params.limit };
  }

  async updateBalance(userId: number, amount: string, operation: "add" | "subtract") {
    const op = operation === "add" ? sql`+` : sql`-`;
    await this.db
      .update(users)
      .set({
        balance: sql`${users.balance} ${op} ${amount}`,
        ...(operation === "add" ? { totalEarned: sql`${users.totalEarned} + ${amount}` } : {}),
      })
      .where(eq(users.id, userId));
  }

  async update(userId: number, data: Partial<{ role: "shnyr" | "traffer" | "moderator" | "financier" | "owner"; isBanned: boolean; balance: string }>) {
    await this.db.update(users).set(data).where(eq(users.id, userId));
  }

  async getLeaderboard(limit = 10) {
    return this.db.query.users.findMany({
      where: and(
        eq(users.role, "traffer"),
        eq(users.hideFromLeaderboard, false)
      ),
      orderBy: desc(users.totalEarned),
      limit,
      columns: {
        id: true,
        username: true,
        firstName: true,
        totalEarned: true,
      },
    });
  }

  async toggleLeaderboardVisibility(userId: number) {
    const user = await this.findById(userId);
    if (!user) return null;
    await this.db
      .update(users)
      .set({ hideFromLeaderboard: !user.hideFromLeaderboard })
      .where(eq(users.id, userId));
    return !user.hideFromLeaderboard;
  }

  async findByRoles(roles: string[]) {
    if (roles.length === 0) return [];
    return this.db.query.users.findMany({
      where: inArray(users.role, roles as typeof users.role.enumValues),
      columns: { id: true, telegramId: true, role: true },
    });
  }

  async getReferrals(userId: number) {
    return this.db.query.users.findMany({
      where: eq(users.referrerId, userId),
      columns: {
        id: true,
        username: true,
        firstName: true,
        totalEarned: true,
        createdAt: true,
      },
    });
  }
}
