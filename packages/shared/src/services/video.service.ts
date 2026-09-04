import {
  type Database,
  videos,
  eq,
  desc,
  count,
  and,
} from "@trafferbot/db";
import type { VideoStatus } from "../constants";

export class VideoService {
  constructor(private db: Database) {}

  async submit(data: { userId: number; platformId: number; url: string; statsPhoto1?: string; statsPhoto2?: string }) {
    const [video] = await this.db.insert(videos).values(data).returning();
    return video;
  }

  async review(
    id: number,
    data: {
      status: "approved" | "rejected";
      earnings?: string;
      reviewedBy: number;
      reviewNote?: string;
    }
  ) {
    const [video] = await this.db
      .update(videos)
      .set(data)
      .where(eq(videos.id, id))
      .returning();
    return video;
  }

  async findById(id: number) {
    return this.db.query.videos.findFirst({
      where: eq(videos.id, id),
      with: { user: true, platform: true },
    });
  }

  async listByUser(userId: number) {
    return this.db.query.videos.findMany({
      where: eq(videos.userId, userId),
      with: { platform: true },
      orderBy: desc(videos.createdAt),
    });
  }

  async list(params: { page: number; limit: number; status?: VideoStatus }) {
    const offset = (params.page - 1) * params.limit;
    const where = params.status
      ? eq(videos.status, params.status)
      : undefined;

    const [items, [total]] = await Promise.all([
      this.db.query.videos.findMany({
        where,
        with: { user: true, platform: true, reviewer: true },
        limit: params.limit,
        offset,
        orderBy: desc(videos.createdAt),
      }),
      this.db.select({ count: count() }).from(videos).where(where),
    ]);

    return { items, total: total.count, page: params.page, limit: params.limit };
  }

  async countByUser(userId: number) {
    const [result] = await this.db
      .select({ count: count() })
      .from(videos)
      .where(and(eq(videos.userId, userId), eq(videos.status, "approved")));
    return result.count;
  }
}
