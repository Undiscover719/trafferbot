import { requireAuth, jsonResponse } from "@/lib/api-helpers";
import { services } from "@/lib/services";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const stats = await services.stats.getDashboardStats();
  return jsonResponse(stats);
}
