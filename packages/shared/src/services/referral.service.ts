import {
  type Database,
  referralEarnings,
  users,
  eq,
  desc,
  sql,
  sum,
} from "@trafferbot/db";
import { SettingsService } from "./settings.service";
import { SETTINGS_KEYS } from "../constants";

export class ReferralService {
  constructor(
    private db: Database,
    private settingsService: SettingsService
  ) {}

  async processReferralEarning(data: {
    userId: number;
    videoId: number;
    videoEarnings: string;
  }) {
    // Get the user to check if they have a referrer
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, data.userId),
    });
    if (!user?.referrerId) return null;

    // Get referral percent from settings
    const percent = await this.settingsService.get<number>(
      SETTINGS_KEYS.REFERRAL_PERCENT
    );
    if (!percent || percent <= 0) return null;

    const amount = (parseFloat(data.videoEarnings) * percent / 100).toFixed(2);
    if (parseFloat(amount) <= 0) return null;

    // Create referral earning record
    const [earning] = await this.db
      .insert(referralEarnings)
      .values({
        referrerId: user.referrerId,
        referralId: data.userId,
        videoId: data.videoId,
        amount,
      })
      .returning();

    // Add to referrer's balance
    await this.db
      .update(users)
      .set({
        balance: sql`${users.balance} + ${amount}`,
        totalEarned: sql`${users.totalEarned} + ${amount}`,
      })
      .where(eq(users.id, user.referrerId));

    return earning;
  }

  async getEarningsByReferrer(referrerId: number) {
    return this.db.query.referralEarnings.findMany({
      where: eq(referralEarnings.referrerId, referrerId),
      with: { referral: true, video: true },
      orderBy: desc(referralEarnings.createdAt),
    });
  }

  async getTotalByReferrer(referrerId: number) {
    const [result] = await this.db
      .select({ total: sum(referralEarnings.amount) })
      .from(referralEarnings)
      .where(eq(referralEarnings.referrerId, referrerId));
    return result.total ?? "0";
  }
}
