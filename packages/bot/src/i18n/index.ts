/**
 * Lightweight i18n system for the TrafferBot Telegram bot.
 *
 * - Default locale: `en` (English)
 * - Runtime locale is controlled by the `BOT_LOCALE` environment variable.
 *   If the variable is unset or the requested locale file does not exist,
 *   the system falls back to `en`.
 * - Locale files live at `src/i18n/locales/<lang>.json`.
 * - Template variables use the `{{placeholder}}` syntax.
 * - The `t()` function is typed against the English locale shape so that
 *   TypeScript catches unknown keys at compile time.
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Recursive leaf → string shape extracted from the English locale file. */
import type enJson from "./locales/en.json";

export type LocaleShape = typeof enJson;

/**
 * Dot-notation key union derived from the locale shape.
 * E.g. "start.welcome_default" | "menu.already_member" | …
 */
type DotPaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends Record<string, unknown>
    ? DotPaths<T[K], `${Prefix}${K}.`>
    : never;
}[keyof T & string];

export type LocaleKey = DotPaths<LocaleShape>;

/** Template params — a plain string-value record. */
export type LocaleParams = Record<string, string | number>;

// ---------------------------------------------------------------------------
// Locale loading
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOCALES_DIR = join(__dirname, "locales");

/** Default / fallback locale tag. */
export const DEFAULT_LOCALE = "en" as const;

/** Currently loaded locale tag (resolved at startup). */
let _currentLocale: string = DEFAULT_LOCALE;

/** Flattened dot-notation key → template string map for fast lookups. */
let _messages: Record<string, string> = {};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Recursively flattens a nested JSON object into dot-notation keys.
 *
 * ```
 * { menu: { welcome: "Hi" } }  →  { "menu.welcome": "Hi" }
 * ```
 */
function flatten(
  obj: Record<string, unknown>,
  prefix = "",
  out: Record<string, string> = {}
): Record<string, string> {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out[fullKey] = value;
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      flatten(value as Record<string, unknown>, fullKey, out);
    }
  }
  return out;
}

/**
 * Loads and parses a locale JSON file.
 * Returns `null` if the file cannot be found or parsed.
 */
function loadLocaleFile(lang: string): Record<string, string> | null {
  const filePath = join(LOCALES_DIR, `${lang}.json`);
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return flatten(parsed);
  } catch (err) {
    console.error(`[i18n] Failed to parse locale file "${filePath}":`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialises the i18n system.
 *
 * Call once during bot startup **before** any handler is registered.
 * Reads `BOT_LOCALE` from the environment; falls back to `"en"` if the
 * requested locale file is missing.
 *
 * @param locale - Optional override (useful for tests). Falls back to
 *                 `process.env.BOT_LOCALE` → `"en"`.
 */
export function loadLocale(locale?: string): void {
  const requested = locale ?? process.env.BOT_LOCALE ?? DEFAULT_LOCALE;

  // Try the requested locale first.
  let messages = loadLocaleFile(requested);

  if (messages) {
    _currentLocale = requested;
    _messages = messages;
    console.log(`[i18n] Locale loaded: "${_currentLocale}"`);
    return;
  }

  // Warn and fall back to English.
  if (requested !== DEFAULT_LOCALE) {
    console.warn(
      `[i18n] Locale "${requested}" not found — falling back to "${DEFAULT_LOCALE}".`
    );
  }

  messages = loadLocaleFile(DEFAULT_LOCALE);
  if (!messages) {
    // This is a hard error; the English locale file must always exist.
    throw new Error(
      `[i18n] Default locale file "locales/${DEFAULT_LOCALE}.json" is missing. ` +
        "Cannot start without a base locale."
    );
  }

  _currentLocale = DEFAULT_LOCALE;
  _messages = messages;
  console.log(`[i18n] Locale loaded: "${_currentLocale}" (default)`);
}

/**
 * Returns the currently active locale tag (e.g. `"en"`).
 */
export function getCurrentLocale(): string {
  return _currentLocale;
}

/**
 * Typed translation function.
 *
 * Resolves a dot-notation key against the loaded locale and interpolates
 * any `{{placeholder}}` variables from `params`.
 *
 * ```ts
 * t("menu.already_member")
 * // → "✅ You are already on the team!"
 *
 * t("menu.balance_text", { balance: "100 USD", totalEarned: "500 USD" })
 * // → "💰 *Your balance:* 100 USD\n📈 *Total earned:* 500 USD\n…"
 * ```
 *
 * @param key    - A dot-notation key from the English locale (type-checked).
 * @param params - Optional substitution map for `{{placeholder}}` tokens.
 * @returns The translated (and interpolated) string, or the raw key if not found.
 */
export function t(key: LocaleKey, params?: LocaleParams): string {
  if (Object.keys(_messages).length === 0) {
    // Locale not yet loaded — auto-load the default so that the function is
    // safe to call in module-level code or tests without explicit init.
    loadLocale(DEFAULT_LOCALE);
  }

  let message = _messages[key];

  if (message === undefined) {
    console.warn(`[i18n] Missing translation key: "${key}"`);
    return key;
  }

  if (params) {
    message = message.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
      const val = params[name];
      return val !== undefined ? String(val) : `{{${name}}}`;
    });
  }

  return message;
}
