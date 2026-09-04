import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { applicationStatusEnum } from "./enums";
import { users } from "./users";
import { platforms } from "./platforms";

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  status: applicationStatusEnum("status").default("pending").notNull(),
  platformId: integer("platform_id")
    .references(() => platforms.id)
    .notNull(),
  channelUrl: varchar("channel_url", { length: 500 }).notNull(),
  aboutSelf: text("about_self"),
  referralSource: text("referral_source"),
  comment: text("comment"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNote: text("review_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  platform: one(platforms, {
    fields: [applications.platformId],
    references: [platforms.id],
  }),
  reviewer: one(users, {
    fields: [applications.reviewedBy],
    references: [users.id],
  }),
}));
