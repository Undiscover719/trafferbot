import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Locale middleware — foundational i18n configuration.
 *
 * Currently the admin panel supports a single locale: `en` (English).
 * This middleware sets the `x-locale` request header so that server
 * components and API routes can read the active locale without any
 * additional runtime logic. When additional locales are added later,
 * this middleware can be extended to negotiate the locale from the
 * `Accept-Language` header and rewrite/redirect accordingly.
 */

export const DEFAULT_LOCALE = "en";
export const SUPPORTED_LOCALES = ["en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function middleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  // Propagate the resolved locale to downstream handlers via a custom header.
  response.headers.set("x-locale", DEFAULT_LOCALE);

  return response;
}

export const config = {
  /*
   * Match all request paths EXCEPT:
   * - _next/static  (static assets)
   * - _next/image   (image optimisation)
   * - favicon.ico
   * - public files  (anything with a file extension in the root)
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
