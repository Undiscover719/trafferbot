# Bot i18n System

Lightweight, zero-dependency internationalisation for the TrafferBot Telegram bot.

---

## Quick start

```ts
import { loadLocale, t } from "./i18n/index";

// Call once at bot startup (before any handler runs).
loadLocale(); // reads BOT_LOCALE env var; falls back to "en"

// Use anywhere in handlers / scenes / keyboards.
await ctx.reply(t("start.welcome_default"));
await ctx.reply(t("menu.balance_text", { balance: "100 USD", totalEarned: "500 USD" }));
```

---

## How it works

| Concept | Detail |
|---|---|
| **Default locale** | `en` (English) — always present, never removable |
| **Runtime locale** | Set via the `BOT_LOCALE` environment variable |
| **Locale files** | `src/i18n/locales/<lang>.json` (plain JSON, nested objects) |
| **Key format** | Dot-notation — e.g. `"menu.balance_text"`, `"notify.video_approved"` |
| **Templates** | `{{placeholder}}` syntax — e.g. `"Hello, {{name}}"` |
| **Type safety** | `t()` is typed against `en.json`; unknown keys are compile errors |
| **Fallback** | If `BOT_LOCALE` file is missing, falls back to `en` with a warning |

---

## Environment variable

```
BOT_LOCALE=en   # default — can be omitted
BOT_LOCALE=ru   # switch to Russian (requires locales/ru.json)
```

The variable is read by `loadLocale()` at startup. Changing it requires a bot restart.

---

## Adding a new locale

1. Copy `src/i18n/locales/en.json` → `src/i18n/locales/<lang>.json`  
   (e.g. `ru.json` for Russian)

2. Translate every string value. **Do not change the keys.** Keep the same nested
   structure as the English file.

3. Set `BOT_LOCALE=<lang>` in your `.env` file and restart the bot.

```bash
BOT_LOCALE=ru pnpm dev:bot
```

> **Note:** Missing keys in a non-English locale will fall back to the **key string**
> itself (not the English value), and a warning is printed to the console. Keep your
> locale files complete.

---

## File structure

```
src/i18n/
  index.ts            Runtime — loadLocale(), t(), types
  README.md           This file
  locales/
    en.json           English (canonical — source of truth for key types)
    ru.json           Russian (example — add your own langs here)
```

---

## Key naming conventions

Keys follow `domain.action` or `domain.entity.verb` patterns:

| Prefix | Domain |
|---|---|
| `start.*` | `/start` command messages |
| `menu.*` | Main menu text and buttons |
| `application.*` | Application wizard |
| `video.*` | Video submission wizard |
| `withdrawal.*` | Withdrawal wizard |
| `notify.*` | Async notification messages sent by the poller |
| `errors.*` | Generic error strings |

---

## Template variables

Use `{{name}}` placeholders in the JSON values:

```json
{
  "menu": {
    "balance_text": "💰 *Your balance:* {{balance}}\n📈 *Total earned:* {{totalEarned}}"
  }
}
```

Pass them as the second argument to `t()`:

```ts
t("menu.balance_text", { balance: "100 USD", totalEarned: "500 USD" })
```

If a placeholder has no matching key in `params`, it is left as-is (e.g. `{{balance}}`).

---

## Adding new message keys

1. Add the new key + English string to `en.json` first — English is the canonical source.
2. Add the same key (with translated value) to every other locale file.
3. Use the key via `t()` — TypeScript will auto-complete and type-check it.

```json
// en.json
{
  "someFeature": {
    "greeting": "Hello, {{name}}!"
  }
}
```

```ts
t("someFeature.greeting", { name: "Alice" })
// → "Hello, Alice!"
```
