# TrafferBot

Open-source Telegram bot and admin panel for traffic teams: applications, video reviews, payouts, referrals, and role-based moderation.

## Stack

- **Bot** — Telegraf
- **Admin** — Next.js, NextAuth (Telegram OIDC), shadcn/ui
- **DB** — PostgreSQL, Drizzle ORM
- **Monorepo** — pnpm workspaces

```
packages/
  bot/      Telegram bot
  admin/    Web admin panel
  db/       Schema, migrations, seed
  shared/   Services, validation, permissions
```

## Requirements

- Node.js 20+
- pnpm 9+
- PostgreSQL 16+
- Telegram bot from [@BotFather](https://t.me/BotFather)

## Setup

```bash
git clone https://github.com/kot9kas/trafferbot.git
cd trafferbot
pnpm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `BOT_TOKEN` | Telegram bot token |
| `OWNER_TELEGRAM_ID` | Your Telegram user id (first owner) |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Public admin URL |
| `ADMIN_URL` | Same URL, used in bot notification links |
| `ADMIN_BASE_PATH` | Optional prefix, e.g. `/traffer`. Empty = site root |
| `TELEGRAM_CLIENT_ID` | Bot id from BotFather → Web Login |
| `TELEGRAM_CLIENT_SECRET` | Web Login secret from BotFather |

Local database:

```bash
docker compose up -d
pnpm db:migrate
pnpm db:seed
```

Run:

```bash
pnpm dev:bot
pnpm dev:admin
```

Admin defaults to [http://localhost:80](http://localhost:80). If `ADMIN_BASE_PATH=/traffer`, open `http://localhost/traffer`.

## Roles

| Role | Access |
| --- | --- |
| `owner` | Full admin |
| `financier` | Videos, withdrawals, balances |
| `moderator` | Applications, users |
| `traffer` / `shnyr` | Bot only |

Admin login is Telegram OIDC. The account must already exist in the database with an admin role.

## License

[MIT](LICENSE)
