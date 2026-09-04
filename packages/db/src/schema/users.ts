import {
  pgTable,
  serial,
  bigint,
  varchar,
  decimal,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { userRoleEnum } from "./enums";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: bigint("telegram_id", { mode: "bigint" }).unique().notNull(),
  username: varchar("username", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }),
  role: userRoleEnum("role").default("shnyr").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  totalEarned: decimal("total_earned", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  referrerId: integer("referrer_id"),
  referralCode: varchar("referral_code", { length: 32 }).unique().notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  hideFromLeaderboard: boolean("hide_from_leaderboard").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  referrer: one(users, {
    fields: [users.referrerId],
    references: [users.id],
    relationName: "referrals",
  }),
  referrals: many(users, { relationName: "referrals" }),
}));
