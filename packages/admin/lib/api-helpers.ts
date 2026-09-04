import { NextResponse } from "next/server";
import { auth } from "./auth";
import { hasPermission, ADMIN_ROLES, SETTINGS_KEYS, loadPermissions, type UserRole } from "@trafferbot/shared";
import { services } from "./services";

async function ensurePermissionsLoaded() {
  const dbPerms = await services.settings.get<Record<string, string[]>>(SETTINGS_KEYS.ROLE_PERMISSIONS);
  if (dbPerms) loadPermissions(dbPerms);
}

export async function requireAuth(permission?: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // Load fresh permissions from DB
  await ensurePermissionsLoaded();

  // Always fetch fresh role from DB to prevent stale session exploits
  const userId = parseInt((session.user as { id: string }).id, 10);
  const dbUser = await services.users.findById(userId);
  if (!dbUser) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const role = dbUser.role as UserRole;

  // Non-admin roles have no access to admin panel at all
  if (!ADMIN_ROLES.includes(role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  if (permission && !hasPermission(role, permission)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {
    user: {
      id: dbUser.id,
      role,
      name: dbUser.firstName,
    },
  };
}

/** JSON-safe response that converts BigInt to string */
export function jsonResponse(data: unknown, init?: ResponseInit) {
  const body = JSON.stringify(data, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
  return new NextResponse(body, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
}

export function paginate(url: URL) {
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);
  const search = url.searchParams.get("search") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  return { page, limit, search, status };
}
