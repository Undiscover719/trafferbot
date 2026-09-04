import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { services } from "@/lib/services";
import { updateSettingSchema } from "@trafferbot/shared";

export async function GET() {
  const auth = await requireAuth("settings.manage");
  if (auth.error) return auth.error;

  const all = await services.settings.getAll();
  return NextResponse.json(all);
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth("settings.manage");
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = updateSettingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await services.settings.set(parsed.data.key, parsed.data.value);
  await services.logs.log({
    adminId: auth.user!.id,
    action: "settings.update",
    targetType: "setting",
    details: { key: parsed.data.key },
  });

  return NextResponse.json({ success: true });
}
