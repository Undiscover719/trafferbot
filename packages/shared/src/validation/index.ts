import { z } from "zod";
import { USER_ROLES, APPLICATION_STATUSES, VIDEO_STATUSES, WITHDRAWAL_STATUSES } from "../constants";

// User
export const updateUserSchema = z.object({
  role: z.enum(USER_ROLES).optional(),
  isBanned: z.boolean().optional(),
  balance: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

// Application
export const createApplicationSchema = z.object({
  platformId: z.number().int().positive(),
  channelUrl: z.string().url().max(500),
  aboutSelf: z.string().max(2000).optional(),
  referralSource: z.string().max(500).optional(),
  comment: z.string().max(1000).optional(),
});

export const reviewApplicationSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().max(1000).optional(),
});

// Video
export const submitVideoSchema = z.object({
  platformId: z.number().int().positive(),
  url: z.string().url().max(500),
});

export const reviewVideoSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  earnings: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  reviewNote: z.string().max(1000).optional(),
});

// Withdrawal
export const createWithdrawalSchema = z.object({
  methodId: z.number().int().positive(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  requisites: z.string().min(1).max(500),
});

export const processWithdrawalSchema = z.object({
  status: z.enum(["approved", "rejected", "completed"]),
  processNote: z.string().max(1000).optional(),
});

// Platform
export const platformSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(10).nullable().optional(),
  isActive: z.boolean().optional(),
});

// Withdrawal Method
export const withdrawalMethodSchema = z.object({
  name: z.string().min(1).max(100),
  minAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  isActive: z.boolean().optional(),
});

// Settings
export const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
});

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
});
