import { requireAuth, jsonResponse } from "@/lib/api-helpers";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  return jsonResponse({ id: auth.user!.id, role: auth.user!.role, name: auth.user!.name });
}
