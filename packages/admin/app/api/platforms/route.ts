import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { services } from "@/lib/services";
import { platformSchema } from "@trafferbot/shared";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const platforms = await services.platforms.getAll(false);
  return NextResponse.json(platforms);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth("platforms.manage");
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = platformSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const platform = await services.platforms.create({ ...parsed.data, icon: parsed.data.icon ?? undefined });
  await services.logs.log({
    adminId: auth.user!.id,
    action: "platform.create",
    targetType: "platform",
    targetId: platform.id,
    details: parsed.data,
  });

  return NextResponse.json(platform, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth("platforms.manage");
  if (auth.error) return auth.error;

  const body = await req.json();
  const { id, ...rest } = body;
  const parsed = platformSchema.partial().safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updateData = { ...parsed.data, icon: parsed.data.icon ?? undefined };
  const platform = await services.platforms.update(id, updateData);
  await services.logs.log({
    adminId: auth.user!.id,
    action: "platform.update",
    targetType: "platform",
    targetId: id,
    details: parsed.data,
  });

  return NextResponse.json(platform);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth("platforms.manage");
  if (auth.error) return auth.error;

  const { id } = await req.json();
  await services.platforms.delete(id);
  await services.logs.log({
    adminId: auth.user!.id,
    action: "platform.delete",
    targetType: "platform",
    targetId: id,
  });

  return NextResponse.json({ success: true });
}
