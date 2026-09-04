"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { withBasePath } from "@/lib/base-path";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider basePath={withBasePath("/api/auth")}>
      {children}
    </NextAuthSessionProvider>
  );
}
