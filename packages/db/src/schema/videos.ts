import {
  pgTable,
  serial,
  integer,
  varchar,
  decimal,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { videoStatusEnum } from "./enums";
import { users } from "./users";
import { platforms } from "./platforms";

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  platformId: integer("platform_id")
    .references(() => platforms.id)
    .notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  statsPhoto1: varchar("stats_photo_1", { length: 500 }),
  statsPhoto2: varchar("stats_photo_2", { length: 500 }),
  status: videoStatusEnum("status").default("pending").notNull(),
  earnings: decimal("earnings", { precision: 12, scale: 2 }),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNote: text("review_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const videosRelations = relations(videos, ({ one }) => ({
  user: one(users, {
    fields: [videos.userId],
    references: [users.id],
  }),
  platform: one(platforms, {
    fields: [videos.platformId],
    references: [platforms.id],
  }),
  reviewer: one(users, {
    fields: [videos.reviewedBy],
    references: [users.id],
  }),
}));
