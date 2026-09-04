import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { services } from "@/lib/services";
import { withdrawalMethodSchema } from "@trafferbot/shared";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const methods = await services.withdrawals.getMethods(false);
  return NextResponse.json(methods);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth("withdrawal_methods.manage");
  if (auth.error) return auth.error;

  const body = await req.json();
  const parsed = withdrawalMethodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const method = await services.withdrawals.createMethod(parsed.data);
  await services.logs.log({
    adminId: auth.user!.id,
    action: "withdrawal_method.create",
    targetType: "withdrawal_method",
    targetId: method.id,
    details: parsed.data,
  });

  return NextResponse.json(method, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth("withdrawal_methods.manage");
  if (auth.error) return auth.error;

  const body = await req.json();
  const { id, ...rest } = body;
  const parsed = withdrawalMethodSchema.partial().safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const method = await services.withdrawals.updateMethod(id, parsed.data);
  await services.logs.log({
    adminId: auth.user!.id,
    action: "withdrawal_method.update",
    targetType: "withdrawal_method",
    targetId: id,
    details: parsed.data,
  });

  return NextResponse.json(method);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth("withdrawal_methods.manage");
  if (auth.error) return auth.error;

  const { id } = await req.json();
  await services.withdrawals.deleteMethod(id);
  await services.logs.log({
    adminId: auth.user!.id,
    action: "withdrawal_method.delete",
    targetType: "withdrawal_method",
    targetId: id,
  });

  return NextResponse.json({ success: true });
}
