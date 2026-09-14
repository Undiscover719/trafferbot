# Bot i18n

The bot uses a lightweight, zero-dependency i18n helper built on top of
Node.js `fs.readFileSync`. No external library is required.

## File layout

```
src/i18n/
  index.ts          — t(), preloadLocales(), Locale type
  locales/
    en.json         — English translations (default)
```

## Usage

```typescript
import { t } from "../i18n/index";

// Simple key
t("start.welcome_default")
// → "Welcome! 🎬"

// With interpolation variables ({{variable}} syntax)
t("menu.application_status_pending", { id: 42 })
// → "⏳ Your application #42 is under review.\n\nPlease wait for an administrator's decision."
```

## Adding a new locale

1. Copy `locales/en.json` to `locales/<code>.json` (e.g. `ru.json`).
2. Translate all values.
3. Add the code to the `Locale` union type in `index.ts`.
4. Call `preloadLocales(["en", "<code>"])` in `src/index.ts`.

## Key naming convention

```
<feature>.<description>
```

- `start.*`       — `/start` command
- `menu.*`        — Main menu handlers
- `application.*` — Application wizard scene
- `video.*`       — Video submission wizard scene
- `withdrawal.*`  — Withdrawal wizard scene
- `notify.*`      — Notification messages sent by the poller
- `errors.*`      — Generic error messages
