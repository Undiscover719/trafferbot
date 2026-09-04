import { requireAuth, jsonResponse } from "@/lib/api-helpers";
import { services } from "@/lib/services";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const days = Math.min(parseInt(url.searchParams.get("days") ?? "90", 10), 365);

  const data = await services.stats.getChartData(days);
  return jsonResponse(data);
}
