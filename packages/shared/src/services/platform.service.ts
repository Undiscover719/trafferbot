import { type Database, platforms, eq } from "@trafferbot/db";

export class PlatformService {
  constructor(private db: Database) {}

  async getAll(activeOnly = true) {
    if (activeOnly) {
      return this.db.query.platforms.findMany({
        where: eq(platforms.isActive, true),
      });
    }
    return this.db.query.platforms.findMany();
  }

  async findById(id: number) {
    return this.db.query.platforms.findFirst({
      where: eq(platforms.id, id),
    });
  }

  async create(data: { name: string; icon?: string }) {
    const [platform] = await this.db
      .insert(platforms)
      .values(data)
      .returning();
    return platform;
  }

  async update(
    id: number,
    data: Partial<{ name: string; icon: string; isActive: boolean }>
  ) {
    const [platform] = await this.db
      .update(platforms)
      .set(data)
      .where(eq(platforms.id, id))
      .returning();
    return platform;
  }

  async delete(id: number) {
    await this.db.delete(platforms).where(eq(platforms.id, id));
  }
}
