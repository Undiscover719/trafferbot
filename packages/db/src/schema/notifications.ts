import {
  pgTable,
  serial,
  bigint,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  chatId: bigint("chat_id", { mode: "bigint" }).notNull(),
  message: text("message").notNull(),
  parseMode: text("parse_mode").default("HTML"),
  sent: boolean("sent").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
