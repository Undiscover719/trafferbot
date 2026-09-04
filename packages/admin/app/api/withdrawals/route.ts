import { NextRequest, NextResponse } from "next/server";
import { requireAuth, paginate, jsonResponse } from "@/lib/api-helpers";
import { services } from "@/lib/services";
import { processWithdrawalSchema, type WithdrawalStatus } from "@trafferbot/shared";

export async function GET(req: NextRequest) {
  const auth = await requireAuth("withdrawals.process");
  if (auth.error) return auth.error;

  const params = paginate(new URL(req.url));
  const result = await services.withdrawals.list({
    ...params,
    status: params.status as WithdrawalStatus | undefined,
  });
  return jsonResponse(result);
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth("withdrawals.process");
  if (auth.error) return auth.error;

  const body = await req.json();
  const { id, ...rest } = body;
  const parsed = processWithdrawalSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const wd = await services.withdrawals.findById(id);

  // If rejected, return balance to user
  if (parsed.data.status === "rejected" && wd) {
    await services.users.updateBalance(wd.userId, wd.amount, "add");
  }

  const result = await services.withdrawals.process(id, {
    ...parsed.data,
    processedBy: auth.user!.id,
  });

  // Notify user about withdrawal status
  if (wd?.user) {
    const statusText: Record<string, string> = {
      approved: "одобрена",
      rejected: "отклонена",
      completed: "выполнена",
    };
    const label = statusText[parsed.data.status] ?? parsed.data.status;
    let msg = `Ваша заявка на вывод <b>${wd.amount} ₽</b> ${label}.`;
    if (parsed.data.processNote) {
      msg += `\nКомментарий: ${parsed.data.processNote}`;
    }
    await services.notifications.enqueue(wd.user.telegramId, msg);
  }

  await services.logs.log({
    adminId: auth.user!.id,
    action: `withdrawal.${parsed.data.status}`,
    targetType: "withdrawal",
    targetId: id,
    details: parsed.data,
  });

  return jsonResponse(result);
}
