import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type Locale = "en";

export const DEFAULT_LOCALE: Locale = "en";

type NestedRecord = { [key: string]: string | NestedRecord };

/**
 * Loads and caches locale translation dictionaries.
 */
const cache = new Map<Locale, NestedRecord>();

function loadLocale(locale: Locale): NestedRecord {
  if (cache.has(locale)) return cache.get(locale)!;

  const filePath = join(__dirname, "locales", `${locale}.json`);
  const raw = readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as NestedRecord;
  cache.set(locale, parsed);
  return parsed;
}

/**
 * Resolves a dot-notation key from a nested object.
 * e.g. "start.welcome_default" → dictionary["start"]["welcome_default"]
 */
function resolvePath(dict: NestedRecord, key: string): string | null {
  const parts = key.split(".");
  let node: string | NestedRecord = dict;

  for (const part of parts) {
    if (typeof node !== "object" || node === null) return null;
    node = node[part];
  }

  return typeof node === "string" ? node : null;
}

/**
 * Interpolates `{{variable}}` placeholders in a translation string.
 */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

/**
 * Translate a key with optional interpolation variables.
 *
 * @param key  Dot-notation path, e.g. "start.welcome_default"
 * @param vars Optional interpolation variables
 * @param locale Locale to use (defaults to DEFAULT_LOCALE)
 * @returns Translated string, or the key itself if not found
 */
export function t(
  key: string,
  vars?: Record<string, string | number>,
  locale: Locale = DEFAULT_LOCALE
): string {
  const dict = loadLocale(locale);
  const raw = resolvePath(dict, key);

  if (raw === null) {
    console.warn(`[i18n] Missing translation key: "${key}" for locale "${locale}"`);
    return key;
  }

  return interpolate(raw, vars);
}

/**
 * Pre-loads all supported locales into the cache at startup.
 */
export function preloadLocales(locales: Locale[] = [DEFAULT_LOCALE]): void {
  for (const locale of locales) {
    loadLocale(locale);
  }
}
