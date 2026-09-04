export const USER_ROLES = ["shnyr", "traffer", "moderator", "financier", "owner"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const APPLICATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const VIDEO_STATUSES = ["pending", "approved", "rejected"] as const;
export type VideoStatus = (typeof VIDEO_STATUSES)[number];

export const WITHDRAWAL_STATUSES = ["pending", "approved", "rejected", "completed"] as const;
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];

export const ADMIN_ROLES: UserRole[] = ["moderator", "financier", "owner"];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  shnyr: [],
  traffer: [],
  moderator: [
    "applications.review",
    "users.view",
  ],
  financier: [
    "videos.review",
    "withdrawals.process",
    "users.view",
    "users.edit_balance",
  ],
  owner: [
    "applications.review",
    "videos.review",
    "withdrawals.process",
    "users.view",
    "users.edit",
    "users.ban",
    "users.edit_balance",
    "users.change_role",
    "platforms.manage",
    "withdrawal_methods.manage",
    "settings.manage",
    "logs.view",
  ],
};

/** Active permissions — starts as defaults, can be overridden from DB via loadPermissions() */
let activePermissions: Record<UserRole, string[]> = { ...DEFAULT_ROLE_PERMISSIONS };

/** Load permission overrides from DB settings value */
export function loadPermissions(dbValue: Record<string, string[]>) {
  activePermissions = { ...DEFAULT_ROLE_PERMISSIONS };
  for (const role of ADMIN_ROLES) {
    if (dbValue[role]) {
      activePermissions[role] = dbValue[role];
    }
  }
}

/** For backwards compat — read-only view of current permissions */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = new Proxy(
  {} as Record<UserRole, string[]>,
  { get: (_target, prop: string) => activePermissions[prop as UserRole] }
);

export function hasPermission(role: UserRole, permission: string): boolean {
  return activePermissions[role]?.includes(permission) ?? false;
}

export function rolesWithPermission(permission: string): UserRole[] {
  return USER_ROLES.filter((role) => activePermissions[role]?.includes(permission));
}

export function getPermissions(): Record<UserRole, string[]> {
  return { ...activePermissions };
}

export const SETTINGS_KEYS = {
  REFERRAL_PERCENT: "referral_percent",
  WELCOME_TEXT: "welcome_text",
  RULES_TEXT: "rules_text",
  PROJECT_LINKS: "project_links",
  NOTIFY_GROUP_ID: "notify_group_id",
  ROLE_PERMISSIONS: "role_permissions",
} as const;

/** All permissions that can be assigned to roles */
export const ALL_PERMISSIONS = [
  "applications.review",
  "videos.review",
  "withdrawals.process",
  "users.view",
  "users.edit",
  "users.ban",
  "users.edit_balance",
  "users.change_role",
  "platforms.manage",
  "withdrawal_methods.manage",
  "settings.manage",
  "logs.view",
] as const;

export const PERMISSION_LABELS: Record<string, string> = {
  "applications.review": "Рассмотрение заявок",
  "videos.review": "Рассмотрение видео",
  "withdrawals.process": "Обработка выводов",
  "users.view": "Просмотр пользователей",
  "users.edit": "Редактирование пользователей",
  "users.ban": "Бан пользователей",
  "users.edit_balance": "Редактирование баланса",
  "users.change_role": "Смена ролей",
  "platforms.manage": "Управление платформами",
  "withdrawal_methods.manage": "Управление способами вывода",
  "settings.manage": "Управление настройками",
  "logs.view": "Просмотр логов",
};
