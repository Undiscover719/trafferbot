import {
  type Database,
  withdrawals,
  withdrawalMethods,
  eq,
  desc,
  count,
} from "@trafferbot/db";
import type { WithdrawalStatus } from "../constants";

export class WithdrawalService {
  constructor(private db: Database) {}

  async create(data: {
    userId: number;
    methodId: number;
    amount: string;
    requisites: string;
  }) {
    const [withdrawal] = await this.db
      .insert(withdrawals)
      .values(data)
      .returning();
    return withdrawal;
  }

  async process(
    id: number,
    data: {
      status: "approved" | "rejected" | "completed";
      processedBy: number;
      processNote?: string;
    }
  ) {
    const [withdrawal] = await this.db
      .update(withdrawals)
      .set(data)
      .where(eq(withdrawals.id, id))
      .returning();
    return withdrawal;
  }

  async findById(id: number) {
    return this.db.query.withdrawals.findFirst({
      where: eq(withdrawals.id, id),
      with: { user: true, method: true },
    });
  }

  async listByUser(userId: number) {
    return this.db.query.withdrawals.findMany({
      where: eq(withdrawals.userId, userId),
      with: { method: true },
      orderBy: desc(withdrawals.createdAt),
    });
  }

  async list(params: {
    page: number;
    limit: number;
    status?: WithdrawalStatus;
  }) {
    const offset = (params.page - 1) * params.limit;
    const where = params.status
      ? eq(withdrawals.status, params.status)
      : undefined;

    const [items, [total]] = await Promise.all([
      this.db.query.withdrawals.findMany({
        where,
        with: { user: true, method: true, processor: true },
        limit: params.limit,
        offset,
        orderBy: desc(withdrawals.createdAt),
      }),
      this.db.select({ count: count() }).from(withdrawals).where(where),
    ]);

    return { items, total: total.count, page: params.page, limit: params.limit };
  }

  // Withdrawal methods
  async getMethods(activeOnly = true) {
    if (activeOnly) {
      return this.db.query.withdrawalMethods.findMany({
        where: eq(withdrawalMethods.isActive, true),
      });
    }
    return this.db.query.withdrawalMethods.findMany();
  }

  async createMethod(data: { name: string; minAmount: string; isActive?: boolean }) {
    const [method] = await this.db
      .insert(withdrawalMethods)
      .values(data)
      .returning();
    return method;
  }

  async updateMethod(
    id: number,
    data: Partial<{ name: string; minAmount: string; isActive: boolean }>
  ) {
    const [method] = await this.db
      .update(withdrawalMethods)
      .set(data)
      .where(eq(withdrawalMethods.id, id))
      .returning();
    return method;
  }

  async deleteMethod(id: number) {
    await this.db.delete(withdrawalMethods).where(eq(withdrawalMethods.id, id));
  }
}
