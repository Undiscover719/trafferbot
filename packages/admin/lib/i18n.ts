/**
 * Admin panel i18n configuration.
 *
 * The admin panel is a server-rendered Next.js application.  All UI strings
 * are written directly in English (the canonical language of the project).
 * This module centralises the locale constant so that it can be consumed by:
 *
 *  - The root `<html lang="...">` attribute in `app/layout.tsx`
 *  - Any future server-side date/number formatting utilities
 *  - Any future i18n middleware or Accept-Language negotiation
 *
 * If you later add a full i18n library (next-intl, i18next, …) this file is
 * the right place to bootstrap it.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default / canonical locale for the admin panel. */
export const DEFAULT_LOCALE = "en" as const;

/**
 * BCP-47 language tag used for the `<html lang>` attribute and
 * `Intl.*` constructors throughout the admin panel.
 *
 * Reads `NEXT_PUBLIC_ADMIN_LOCALE` from the environment so that operators
 * can override it without a code change.  Falls back to `"en"`.
 */
export const LOCALE: string =
  process.env.NEXT_PUBLIC_ADMIN_LOCALE ?? DEFAULT_LOCALE;

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Formats a numeric currency value as a locale-aware string.
 *
 * @example
 * formatAmount(1234.5)  // → "1,234.50" (en)
 */
export function formatAmount(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/**
 * Formats a `Date` (or ISO string) as a locale-aware date string.
 *
 * @example
 * formatDate(new Date("2024-06-01"))  // → "6/1/2024" (en)
 */
export function formatDate(
  value: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(LOCALE, options).format(date);
}

/**
 * Formats a `Date` (or ISO string) as a locale-aware date-time string.
 *
 * @example
 * formatDateTime(new Date("2024-06-01T14:30:00Z"))
 * // → "6/1/2024, 2:30:00 PM" (en)
 */
export function formatDateTime(
  value: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  return formatDate(value, {
    dateStyle: "short",
    timeStyle: "medium",
    ...options,
  });
}
