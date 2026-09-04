import { NextRequest, NextResponse } from "next/server";
import { requireAuth, paginate, jsonResponse } from "@/lib/api-helpers";
import { services } from "@/lib/services";
import { reviewApplicationSchema, type ApplicationStatus } from "@trafferbot/shared";

export async function GET(req: NextRequest) {
  const auth = await requireAuth("applications.review");
  if (auth.error) return auth.error;

  const params = paginate(new URL(req.url));
  const result = await services.applications.list({
    ...params,
    status: params.status as ApplicationStatus | undefined,
  });
  return jsonResponse(result);
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth("applications.review");
  if (auth.error) return auth.error;

  const body = await req.json();
  const { id, ...rest } = body;
  const parsed = reviewApplicationSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const app = await services.applications.review(id, {
    ...parsed.data,
    reviewedBy: auth.user!.id,
  });

  // Promote user to traffer on approval
  const user = await services.users.findById(app.userId);
  if (user) {
    if (parsed.data.status === "approved" && user.role === "shnyr") {
      await services.users.update(user.id, { role: "traffer" });
    }

    const statusText = parsed.data.status === "approved"
      ? "одобрена! Добро пожаловать в команду"
      : "отклонена";
    await services.notifications.enqueue(
      user.telegramId,
      `<b>Заявка на вступление</b>\n\nВаша заявка была <b>${statusText}</b>.`
    );
  }

  await services.logs.log({
    adminId: auth.user!.id,
    action: `application.${parsed.data.status}`,
    targetType: "application",
    targetId: id,
    details: parsed.data,
  });

  return jsonResponse(app);
}
