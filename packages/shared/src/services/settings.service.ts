import { type Database, settings, eq } from "@trafferbot/db";

export class SettingsService {
  constructor(private db: Database) {}

  async get<T = unknown>(key: string): Promise<T | null> {
    const row = await this.db.query.settings.findFirst({
      where: eq(settings.key, key),
    });
    return row ? (row.value as T) : null;
  }

  async set(key: string, value: unknown) {
    const existing = await this.db.query.settings.findFirst({
      where: eq(settings.key, key),
    });

    if (existing) {
      await this.db
        .update(settings)
        .set({ value })
        .where(eq(settings.key, key));
    } else {
      await this.db.insert(settings).values({ key, value });
    }
  }

  async getAll() {
    return this.db.query.settings.findMany();
  }
}
