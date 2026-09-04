import { NextRequest, NextResponse } from "next/server";
import { requireAuth, jsonResponse } from "@/lib/api-helpers";
import { services } from "@/lib/services";
import { getPermissions, SETTINGS_KEYS, loadPermissions } from "@trafferbot/shared";

export async function GET() {
  const auth = await requireAuth("settings.manage");
  if (auth.error) return auth.error;

  return jsonResponse(getPermissions());
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth("settings.manage");
  if (auth.error) return auth.error;

  const body = await req.json();
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Save to DB
  await services.settings.set(SETTINGS_KEYS.ROLE_PERMISSIONS, body);

  // Reload in memory
  loadPermissions(body);

  await services.logs.log({
    adminId: auth.user!.id,
    action: "permissions.update",
    targetType: "settings",
    targetId: 0,
    details: body,
  });

  return jsonResponse(getPermissions());
}
