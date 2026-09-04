import {
  UserService,
  ApplicationService,
  VideoService,
  WithdrawalService,
  ReferralService,
  SettingsService,
  PlatformService,
  LogService,
  StatsService,
  NotificationService,
} from "@trafferbot/shared";
import { db } from "./db";

const settingsService = new SettingsService(db);

export const services = {
  users: new UserService(db),
  applications: new ApplicationService(db),
  videos: new VideoService(db),
  withdrawals: new WithdrawalService(db),
  referrals: new ReferralService(db, settingsService),
  settings: settingsService,
  platforms: new PlatformService(db),
  logs: new LogService(db),
  stats: new StatsService(db),
  notifications: new NotificationService(db),
} as const;
