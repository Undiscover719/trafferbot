import { NextRequest, NextResponse } from "next/server";
import { requireAuth, jsonResponse } from "@/lib/api-helpers";
import { services } from "@/lib/services";
import { updateUserSchema } from "@trafferbot/shared";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("users.view");
  if (auth.error) return auth.error;

  const { id } = await params;
  const user = await services.users.findById(parseInt(id, 10));
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return jsonResponse(user);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("users.edit");
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await services.users.update(parseInt(id, 10), parsed.data);
  await services.logs.log({
    adminId: auth.user!.id,
    action: "user.update",
    targetType: "user",
    targetId: parseInt(id, 10),
    details: parsed.data,
  });

  return NextResponse.json({ success: true });
}
