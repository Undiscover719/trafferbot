import { NextRequest, NextResponse } from "next/server";
import { requireAuth, paginate, jsonResponse } from "@/lib/api-helpers";
import { services } from "@/lib/services";
import { reviewVideoSchema, type VideoStatus } from "@trafferbot/shared";
import { users, eq, sql } from "@trafferbot/db";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireAuth("videos.review");
  if (auth.error) return auth.error;

  const params = paginate(new URL(req.url));
  const result = await services.videos.list({
    ...params,
    status: params.status as VideoStatus | undefined,
  });
  return jsonResponse(result);
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth("videos.review");
  if (auth.error) return auth.error;

  const body = await req.json();
  const { id, ...rest } = body;
  const parsed = reviewVideoSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const video = await services.videos.review(id, {
    ...parsed.data,
    reviewedBy: auth.user!.id,
  });

  // If approved with earnings, add to user balance and process referral
  if (parsed.data.status === "approved" && parsed.data.earnings) {
    await db
      .update(users)
      .set({
        balance: sql`${users.balance} + ${parsed.data.earnings}`,
        totalEarned: sql`${users.totalEarned} + ${parsed.data.earnings}`,
      })
      .where(eq(users.id, video.userId));

    await services.referrals.processReferralEarning({
      userId: video.userId,
      videoId: video.id,
      videoEarnings: parsed.data.earnings,
    });
  }

  // Notify user about video review result
  const videoUser = await services.users.findById(video.userId);
  if (videoUser) {
    const videoLink = `<a href="${video.url}">${video.url}</a>`;
    if (parsed.data.status === "approved" && parsed.data.earnings) {
      await services.notifications.enqueue(
        videoUser.telegramId,
        `<b>Видео одобрено!</b>\n\n${videoLink}\n\nВам начислено <b>${parseFloat(parsed.data.earnings).toFixed(2)} ₽</b>.`
      );
    } else if (parsed.data.status === "rejected") {
      const note = parsed.data.reviewNote ? `\nПричина: ${parsed.data.reviewNote}` : "";
      await services.notifications.enqueue(
        videoUser.telegramId,
        `<b>Видео отклонено</b>\n\n${videoLink}\n\nВаше видео не прошло модерацию.${note}`
      );
    }
  }

  await services.logs.log({
    adminId: auth.user!.id,
    action: `video.${parsed.data.status}`,
    targetType: "video",
    targetId: id,
    details: parsed.data,
  });

  return jsonResponse(video);
}
