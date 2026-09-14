"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface MeResponse {
  role: string;
}

/**
 * Returns the current authenticated user's role from the /api/me endpoint.
 * Returns `null` while loading or if unauthenticated.
 */
export function useCurrentRole(): string | null {
  const { data } = useSWR<MeResponse>("/api/me", fetcher);
  return data?.role ?? null;
}
