import { NextRequest } from "next/server";
import { requireAuth, paginate, jsonResponse } from "@/lib/api-helpers";
import { services } from "@/lib/services";

export async function GET(req: NextRequest) {
  const auth = await requireAuth("logs.view");
  if (auth.error) return auth.error;

  const params = paginate(new URL(req.url));
  const result = await services.logs.list(params);
  return jsonResponse(result);
}
