import { type Database, adminLogs, desc, count } from "@trafferbot/db";

export class LogService {
  constructor(private db: Database) {}

  async log(data: {
    adminId: number;
    action: string;
    targetType?: string;
    targetId?: number;
    details?: Record<string, unknown>;
  }) {
    await this.db.insert(adminLogs).values(data);
  }

  async list(params: { page: number; limit: number }) {
    const offset = (params.page - 1) * params.limit;

    const [items, [total]] = await Promise.all([
      this.db.query.adminLogs.findMany({
        with: { admin: true },
        limit: params.limit,
        offset,
        orderBy: desc(adminLogs.createdAt),
      }),
      this.db.select({ count: count() }).from(adminLogs),
    ]);

    return { items, total: total.count, page: params.page, limit: params.limit };
  }
}
