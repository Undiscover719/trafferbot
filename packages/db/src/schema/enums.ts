import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "shnyr",
  "traffer",
  "moderator",
  "financier",
  "owner",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "pending",
  "approved",
  "rejected",
]);

export const videoStatusEnum = pgEnum("video_status", [
  "pending",
  "approved",
  "rejected",
]);

export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "pending",
  "approved",
  "rejected",
  "completed",
]);
