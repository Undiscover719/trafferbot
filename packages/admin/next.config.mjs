/** @type {import('next').NextConfig} */
const nextConfig = {
  // i18n — English is the sole default locale.
  // Next.js App Router does not use the legacy `i18n` key; locale is handled
  // via the `lang` attribute on <html> and, if needed, middleware. This block
  // is kept here as an explicit declaration of intent and for any tooling that
  // reads it (e.g. linters, future Pages Router usage).
  //
  // For App Router locale routing, add a `middleware.ts` at the project root
  // that rewrites paths based on the `Accept-Language` header.

  // Allow the panel to be served under a sub-path (ADMIN_BASE_PATH).
  // Falls back to "" (root) when the env var is not set.
  basePath: process.env.ADMIN_BASE_PATH ?? "",

  // Trust the reverse-proxy headers so NextAuth and redirects work correctly
  // behind nginx / Caddy.
  experimental: {
    // Turbopack is enabled via CLI flag (`--turbopack`); no config needed here.
  },
};

export default nextConfig;
