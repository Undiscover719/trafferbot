import {
  pgTable,
  serial,
  integer,
  decimal,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { videos } from "./videos";

export const referralEarnings = pgTable("referral_earnings", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id")
    .references(() => users.id)
    .notNull(),
  referralId: integer("referral_id")
    .references(() => users.id)
    .notNull(),
  videoId: integer("video_id")
    .references(() => videos.id)
    .notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referralEarningsRelations = relations(
  referralEarnings,
  ({ one }) => ({
    referrer: one(users, {
      fields: [referralEarnings.referrerId],
      references: [users.id],
    }),
    referral: one(users, {
      fields: [referralEarnings.referralId],
      references: [users.id],
    }),
    video: one(videos, {
      fields: [referralEarnings.videoId],
      references: [videos.id],
    }),
  })
);
