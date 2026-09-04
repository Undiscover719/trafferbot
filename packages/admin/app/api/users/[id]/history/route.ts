import { NextRequest } from "next/server";
import { requireAuth, jsonResponse } from "@/lib/api-helpers";
import { services } from "@/lib/services";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("users.view");
  if (auth.error) return auth.error;

  const { id } = await params;
  const userId = parseInt(id, 10);

  const [videosList, withdrawalsList, applicationsList] = await Promise.all([
    services.videos.listByUser(userId),
    services.withdrawals.listByUser(userId),
    services.applications.listByUser(userId),
  ]);

  return jsonResponse({
    videos: videosList,
    withdrawals: withdrawalsList,
    applications: applicationsList,
  });
}
