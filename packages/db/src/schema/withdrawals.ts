import {
  pgTable,
  serial,
  integer,
  varchar,
  decimal,
  boolean,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { withdrawalStatusEnum } from "./enums";
import { users } from "./users";

export const withdrawalMethods = pgTable("withdrawal_methods", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  minAmount: decimal("min_amount", { precision: 12, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  methodId: integer("method_id")
    .references(() => withdrawalMethods.id)
    .notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  requisites: varchar("requisites", { length: 500 }).notNull(),
  status: withdrawalStatusEnum("status").default("pending").notNull(),
  processedBy: integer("processed_by").references(() => users.id),
  processNote: text("process_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, {
    fields: [withdrawals.userId],
    references: [users.id],
  }),
  method: one(withdrawalMethods, {
    fields: [withdrawals.methodId],
    references: [withdrawalMethods.id],
  }),
  processor: one(users, {
    fields: [withdrawals.processedBy],
    references: [users.id],
  }),
}));
