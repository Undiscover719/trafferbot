/**
 * i18n configuration for the admin panel.
 *
 * The admin panel is English-only by default. This module exports locale
 * constants so they can be consumed consistently across server components,
 * client components, and API routes without duplicating magic strings.
 *
 * When additional locales are needed:
 *  1. Add the locale code to SUPPORTED_LOCALES.
 *  2. Extend the middleware (middleware.ts) with Accept-Language negotiation.
 *  3. Add translation files under `locales/<code>.json` (or use a library
 *     such as `next-intl`).
 */

export const DEFAULT_LOCALE = "en" as const;

export const SUPPORTED_LOCALES = ["en"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Returns the locale from the `x-locale` header injected by the middleware,
 * falling back to the default locale if the header is absent or unsupported.
 *
 * Intended for use in server components / route handlers:
 *
 * ```ts
 * import { headers } from "next/headers";
 * import { getLocaleFromHeaders } from "@/lib/i18n";
 *
 * const locale = getLocaleFromHeaders(await headers());
 * ```
 */
export function getLocaleFromHeaders(
  headersList: Headers | { get(name: string): string | null }
): SupportedLocale {
  const raw = headersList.get("x-locale");
  if (raw && (SUPPORTED_LOCALES as readonly string[]).includes(raw)) {
    return raw as SupportedLocale;
  }
  return DEFAULT_LOCALE;
}
