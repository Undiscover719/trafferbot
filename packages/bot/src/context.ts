import { Context, Scenes } from "telegraf";
import type { Database } from "@trafferbot/db";
import type {
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

export interface Services {
  users: UserService;
  applications: ApplicationService;
  videos: VideoService;
  withdrawals: WithdrawalService;
  referrals: ReferralService;
  settings: SettingsService;
  platforms: PlatformService;
  logs: LogService;
  stats: StatsService;
  notifications: NotificationService;
}

export interface BotContext extends Context {
  scene: Scenes.SceneContextScene<BotContext, Scenes.WizardSessionData>;
  wizard: Scenes.WizardContextWizard<BotContext>;
  session: Scenes.WizardSession<Scenes.WizardSessionData>;
  db: Database;
  services: Services;
  dbUser: {
    id: number;
    telegramId: bigint;
    username: string | null;
    firstName: string;
    lastName: string | null;
    role: string;
    balance: string;
    totalEarned: string;
    referrerId: number | null;
    referralCode: string;
    isBanned: boolean;
    hideFromLeaderboard: boolean;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}
