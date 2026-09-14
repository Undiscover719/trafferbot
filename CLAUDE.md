# TrafferBot — Project Context Document

## Project Overview

TrafferBot is an open-source Telegram bot and web admin panel designed for traffic teams. It provides tooling for:

- **Application management** — Users apply via the bot; moderators review and approve/reject
- **Video reviews** — Team members submit video content for review
- **Payouts & withdrawals** — Balance tracking and withdrawal request processing
- **Referral system** — Referral tracking and attribution
- **Role-based moderation** — Granular permissions per admin role
- **Notifications** — Async notification delivery from the bot

---

## Architecture

The project is a **pnpm monorepo** with four packages:

```
packages/
  bot/      Telegram bot (Telegraf)
  admin/    Web admin panel (Next.js)
  db/       Database schema, migrations, seed (Drizzle ORM + PostgreSQL)
  shared/   Business logic services, validation, constants, permissions
```

### Dependency Graph

```
bot    → shared, db
admin  → shared, db
shared → db
db     (no internal deps)
```

- `bot` and `admin` never import from each other
- All business logic lives in `shared` services, consumed by both `bot` and `admin`
- `db` exposes the Drizzle ORM instance, schema types, and re-exports Drizzle operators

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript 5.x (ESM modules throughout) |
| Bot framework | Telegraf 4.x |
| Admin framework | Next.js 16 (App Router) |
| Auth | NextAuth v5 beta (Telegram OIDC via BotFather Web Login) |
| UI components | shadcn/ui, Radix UI, Tailwind CSS v4 |
| Charts | Recharts |
| Tables | TanStack React Table |
| Drag & drop | dnd-kit |
| ORM | Drizzle ORM 0.39+ |
| Database | PostgreSQL 16+ / 17 (Docker: `postgres:17-alpine`) |
| Validation | Zod |
| i18n (bot) | Custom locale system (JSON message files + typed key lookup) |
| Package manager | pnpm 9.1.1 (workspaces) |
| Dev runner | tsx (watch mode for bot) |
| Notifications toast | Sonner |

---

## Package Details

### `packages/db`

**Purpose:** Single source of truth for the database layer.

**Exports:**
- `.` → `src/index.ts` — `createDb(connectionString)` factory, re-exports all schema and Drizzle operators
- `./schema` → `src/schema/index.ts` — all table definitions

**Key files:**
- `src/index.ts` — creates the Drizzle client with `postgres-js`
- `src/schema/` — one file per domain entity:
  - `users.ts` — user accounts, balances, roles
  - `applications.ts` — platform applications
  - `platforms.ts` — supported platforms
  - `videos.ts` — video submissions
  - `withdrawals.ts` — withdrawal requests
  - `referrals.ts` — referral relationships
  - `notifications.ts` — queued bot notifications
  - `admin-logs.ts` — audit log
  - `settings.ts` — key-value settings store
  - `enums.ts` — shared PostgreSQL enums
  - `index.ts` — barrel export
- `src/migrate.ts` — runs Drizzle migrations programmatically
- `src/seed.ts` — seeds initial data (owner user, default settings)
- `drizzle/` — SQL migration files (`0000_*` through `0005_*`)
- `drizzle.config.ts` — Drizzle Kit config

**Pattern:** Always use `createDb(connectionString)` — never a singleton. Each consumer (bot, admin) creates its own instance.

---

### `packages/shared`

**Purpose:** Business logic layer shared between bot and admin. No framework-specific code.

**Exports:**
- `.` → full barrel (`constants`, `utils`, `validation`, `services`)
- `./constants` → `src/constants.ts`
- `./services` → `src/services/index.ts`
- `./validation` → `src/validation/index.ts`

**Services (all class-based, injected with `Database`):**

| Service | Responsibility |
|---|---|
| `UserService` | User CRUD, balance management, role assignment |
| `ApplicationService` | Create, list, review applications |
| `VideoService` | Video submission, review, listing |
| `WithdrawalService` | Withdrawal requests, status updates |
| `ReferralService` | Referral creation and lookup |
| `SettingsService` | Key-value settings (typed `get<T>` / `set`) |
| `PlatformService` | Manage supported platforms |
| `LogService` | Admin audit log write & read |
| `StatsService` | Aggregate dashboard statistics |
| `NotificationService` | Queue and poll notifications for bot delivery |

**Service pattern:**
```typescript
export class SomeService {
  constructor(private db: Database) {}
  // methods use this.db.query.* or this.db.insert/update/select
}
```

**Other exports:**
- `src/constants.ts` — `SETTINGS_KEYS`, role enums, `ApplicationStatus`, etc.
- `src/utils.ts` — general helpers
- `src/validation/index.ts` — Zod schemas for forms and API inputs

**Permissions system:**
- `loadPermissions(dbPerms)` loads role→permission mappings from the database settings
- Used at bot startup and can be hot-reloaded

---

### `packages/bot`

**Purpose:** Telegram bot using Telegraf.

**Key files:**

| File | Role |
|---|---|
| `src/index.ts` | Entry point — loads `.env`, creates bot, starts notification poller, loads permissions, launches bot |
| `src/bot.ts` | `createBot(token, databaseUrl)` factory — registers middleware, handlers, scenes |
| `src/context.ts` | Custom Telegraf context type (extended with services/user) |
| `src/handlers/start.ts` | `/start` command handler |
| `src/handlers/menu.ts` | Main menu handler |
| `src/keyboards/main.ts` | Keyboard layout definitions |
| `src/middlewares/auth.ts` | Auth middleware — loads/creates user from Telegram ID |
| `src/scenes/application.ts` | Wizard scene: application submission flow |
| `src/scenes/video-submit.ts` | Wizard scene: video submission flow |
| `src/scenes/withdrawal.ts` | Wizard scene: withdrawal request flow |
| `src/notification-poller.ts` | Polls `NotificationService` for pending notifications, delivers them |
| `src/utils/notify-admins.ts` | Utility to message admin users |
| `src/i18n/index.ts` | i18n entry point — exports `t()` lookup function and locale loader |
| `src/i18n/locales/en.json` | Default English locale message file |

**i18n System (bot):**

The bot uses a lightweight custom i18n system with typed message key lookup:

- **Locale files** live at `src/i18n/locales/<lang>.json` (e.g., `en.json`)
- **Default locale:** `en` (English)
- **`t(key, params?)`** — typed translation function; resolves dot-notation keys (e.g., `t('menu.welcome')`) against the loaded locale
- Locale is loaded once at startup; switching locales requires a restart or explicit reload
- Message files are plain JSON with nested objects; keys follow `domain.action` or `domain.entity.action` conventions
- Template variables use `{{placeholder}}` syntax (e.g., `"Hello, {{name}}"`)
- All user-facing bot strings must use `t()` — **no hardcoded message strings** in handlers, scenes, or keyboards
- The locale used at runtime is determined by the `BOT_LOCALE` environment variable (defaults to `en`)

**Startup sequence:**
1. Load `.env` from repo root
2. Validate `BOT_TOKEN` and `DATABASE_URL`
3. Load locale via i18n module (respects `BOT_LOCALE`, falls back to `en`)
4. Call `createBot()` to build Telegraf instance
5. Create `db`, `NotificationService`, `SettingsService`
6. Load role permissions from DB
7. Start notification poller
8. `bot.launch()`

**Environment variables used:** `BOT_TOKEN`, `DATABASE_URL`, `OWNER_TELEGRAM_ID`, `ADMIN_URL`, `BOT_LOCALE`

---

### `packages/admin`

**Purpose:** Next.js 16 App Router admin panel with Telegram OIDC login.

**Directory structure:**
```
app/
  (dashboard)/          Protected dashboard routes (layout wraps all)
    page.tsx            Home / stats overview
    applications/       Application management
    users/              User management
    videos/             Video review
    withdrawals/        Withdrawal processing
    withdrawal-methods/ Manage withdrawal methods
    platforms/          Platform management
    settings/           App settings
    permissions/        Role permission editor
    logs/               Audit log viewer
    layout.tsx          Dashboard shell with sidebar
  api/                  API route handlers
    auth/[...nextauth]/ NextAuth handler
    applications/
    logs/
    me/
    permissions/
    platforms/
    settings/
    stats/
    stats/chart/
    telegram-file/
    users/[id]/
    users/[id]/history/
    users/
    videos/
    withdrawal-methods/
    withdrawals/
  login/page.tsx        Login page
  layout.tsx            Root layout
components/
  ui/                   shadcn/ui primitives
  app-sidebar.tsx       Main navigation sidebar
  data-table.tsx        Generic TanStack table wrapper
  section-cards.tsx     Stats cards
  chart-area-interactive.tsx  Dashboard chart
  login-form.tsx
lib/
  auth.ts               NextAuth configuration
  db.ts                 Admin-side db instance
  services.ts           Instantiates shared services
  api-helpers.ts        Response helpers for API routes
  fetcher.ts            SWR/fetch helper
  base-path.ts          ADMIN_BASE_PATH helper
  utils.ts              cn() and other utilities
hooks/
  use-current-role.tsx  Hook: current user's role
  use-mobile.ts         Responsive hook
```

**Auth flow:**
- NextAuth v5 with Telegram OIDC provider (BotFather Web Login)
- User must exist in database with an admin-level role
- `lib/auth.ts` configures the provider and session callbacks

**API routes pattern:**
- Each route imports services from `lib/services.ts`
- Uses `api-helpers.ts` for consistent JSON responses and error handling
- Protected by NextAuth session checks

**Environment variables used:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_BASE_PATH`, `TELEGRAM_CLIENT_ID`, `TELEGRAM_CLIENT_SECRET`

---

## Database Schema Overview

| Table | Description |
|---|---|
| `users` | Telegram users, roles, balances |
| `applications` | Platform application submissions with status |
| `platforms` | Supported advertising platforms |
| `videos` | Video review submissions |
| `withdrawals` | Withdrawal requests |
| `referrals` | User referral relationships |
| `notifications` | Async notification queue for the bot |
| `admin_logs` | Audit trail of admin actions |
| `settings` | Key-value store (JSON values, typed via `SettingsService`) |

**Enums** (`packages/db/src/schema/enums.ts`): shared PostgreSQL enum types (roles, statuses, etc.)

---

## Roles & Permissions

| Role | Access Level |
|---|---|
| `owner` | Full admin access to everything |
| `financier` | Videos, withdrawals, balances |
| `moderator` | Applications, users |
| `traffer` | Bot only (no admin panel) |
| `shnyr` | Bot only (no admin panel) |

- Permissions are stored in the `settings` table under `SETTINGS_KEYS.ROLE_PERMISSIONS`
- Loaded at bot startup via `loadPermissions()`
- Admin panel enforces permissions per route and action

---

## Coding Conventions

### General
- **All packages use ESM** (`"type": "module"` in every `package.json`)
- **TypeScript strict mode** assumed throughout
- **No default exports** in services/utilities — named exports only
- **Barrel files** (`index.ts`) aggregate exports per package/directory

### Services
- All services are **classes** with `constructor(private db: Database) {}`
- Services are **stateless** except for the injected `db`
- Pagination is always `{ page, limit }` → returns `{ items, total, page, limit }`
- Database operations use Drizzle's query builder (`this.db.query.*` for reads, `this.db.insert/update/select` for writes)

### API Routes (admin)
- Instantiate services via `lib/services.ts` (not inline)
- Check session auth before any data access
- Use `api-helpers.ts` for consistent response shapes
- Validate request bodies with Zod schemas from `@trafferbot/shared/validation`

### Bot Handlers
- Custom context type from `src/context.ts`
- Scenes (Wizard scenes) for multi-step flows
- Middleware (`src/middlewares/auth.ts`) attaches the user to context
- **All user-facing strings must go through `t()`** — no inline hardcoded text

### i18n (bot)
- Add new message strings to `src/i18n/locales/en.json` first (English is canonical)
- Keys follow `domain.action` or `domain.entity.verb` naming (e.g., `application.submit.success`)
- Use `{{placeholder}}` for dynamic values in message templates
- To add a new locale: create `src/i18n/locales/<lang>.json` mirroring the `en.json` structure
- The `t()` function is typed against the English locale shape — TypeScript will catch missing keys

### Naming
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `SETTINGS_KEYS`)
- DB schema tables: snake_case in SQL, camelCase in TypeScript schema objects
- i18n locale files: lowercase language code (e.g., `en.json`, `ru.json`)

### Environment
- Single `.env` file at repo root, loaded by each package as needed
- Bot loads via `dotenv` with explicit path to `../../../.env`
- Admin uses Next.js built-in env loading

---

## Development Workflow

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL 16+ (or Docker)

### Initial Setup
```bash
git clone <repo>
cd trafferbot
pnpm install
cp .env.example .env
# Fill in .env variables
docker compose up -d        # Start PostgreSQL
pnpm db:migrate             # Run migrations
pnpm db:seed                # Seed owner user + defaults
```

### Running Locally
```bash
pnpm dev:bot    # tsx watch on packages/bot/src/index.ts
pnpm dev:admin  # next dev --turbopack -p 80
```

Admin panel: `http://localhost:80` (or `http://localhost/ADMIN_BASE_PATH`)

### Database Operations
```bash
pnpm db:generate   # Generate new migration from schema changes
pnpm db:migrate    # Apply migrations
pnpm db:seed       # Re-seed (idempotent for owner)
```

### Build
```bash
pnpm build         # Builds all packages (pnpm -r build)
```

### Root Scripts Reference
| Script | Command |
|---|---|
| `dev:bot` | `pnpm --filter @trafferbot/bot dev` |
| `dev:admin` | `pnpm --filter @trafferbot/admin dev` |
| `build` | `pnpm -r build` |
| `db:generate` | `pnpm --filter @trafferbot/db generate` |
| `db:migrate` | `