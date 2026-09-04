import {
  type Database,
  applications,
  eq,
  desc,
  count,
  and,
} from "@trafferbot/db";
import type { ApplicationStatus } from "../constants";

export class ApplicationService {
  constructor(private db: Database) {}

  async create(data: {
    userId: number;
    platformId: number;
    channelUrl: string;
    aboutSelf?: string;
    referralSource?: string;
    comment?: string;
  }) {
    const [app] = await this.db
      .insert(applications)
      .values(data)
      .returning();
    return app;
  }

  async findPendingByUser(userId: number) {
    return this.db.query.applications.findFirst({
      where: and(
        eq(applications.userId, userId),
        eq(applications.status, "pending")
      ),
    });
  }

  async findApprovedByUser(userId: number) {
    return this.db.query.applications.findFirst({
      where: and(
        eq(applications.userId, userId),
        eq(applications.status, "approved")
      ),
    });
  }

  async listByUser(userId: number) {
    return this.db.query.applications.findMany({
      where: eq(applications.userId, userId),
      with: { platform: true },
      orderBy: desc(applications.createdAt),
    });
  }

  async review(
    id: number,
    data: {
      status: "approved" | "rejected";
      reviewedBy: number;
      reviewNote?: string;
    }
  ) {
    const [app] = await this.db
      .update(applications)
      .set(data)
      .where(eq(applications.id, id))
      .returning();
    return app;
  }

  async list(params: {
    page: number;
    limit: number;
    status?: ApplicationStatus;
  }) {
    const offset = (params.page - 1) * params.limit;
    const where = params.status
      ? eq(applications.status, params.status)
      : undefined;

    const [items, [total]] = await Promise.all([
      this.db.query.applications.findMany({
        where,
        with: { user: true, platform: true, reviewer: true },
        limit: params.limit,
        offset,
        orderBy: desc(applications.createdAt),
      }),
      this.db.select({ count: count() }).from(applications).where(where),
    ]);

    return { items, total: total.count, page: params.page, limit: params.limit };
  }
}
