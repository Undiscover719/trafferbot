/** Admin URL prefix, e.g. `/traffer` or ``. No trailing slash. */
export function getAdminBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH ?? "";
  if (!raw || raw === "/") return "";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.replace(/\/$/, "");
}

export function withBasePath(path: string): string {
  const base = getAdminBasePath();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
