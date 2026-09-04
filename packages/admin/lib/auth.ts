import NextAuth from "next-auth";
import { db } from "./db";
import { users, eq } from "@trafferbot/db";
import { ADMIN_ROLES, type UserRole } from "@trafferbot/shared";
import { withBasePath } from "./base-path";

export const { handlers, signIn, signOut, auth } = NextAuth({
  basePath: withBasePath("/api/auth"),
  providers: [
    {
      id: "telegram",
      name: "Telegram",
      type: "oidc",
      issuer: "https://oauth.telegram.org",
      clientId: process.env.TELEGRAM_CLIENT_ID!,
      clientSecret: process.env.TELEGRAM_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid profile",
          bot_id: process.env.TELEGRAM_CLIENT_ID!,
        },
      },
      profile(profile) {
        return {
          id: String(profile.sub),
          name: profile.name || profile.preferred_username,
          image: profile.picture || null,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile) return false;

      const telegramId = BigInt(profile.sub!);

      const dbUser = await db.query.users.findFirst({
        where: eq(users.telegramId, telegramId),
      });

      if (!dbUser) return false;
      if (!ADMIN_ROLES.includes(dbUser.role as UserRole)) return false;

      return true;
    },
    async jwt({ token, profile }) {
      if (profile) {
        const telegramId = BigInt(profile.sub!);

        const dbUser = await db.query.users.findFirst({
          where: eq(users.telegramId, telegramId),
        });

        if (dbUser) {
          token.userId = String(dbUser.id);
          token.role = dbUser.role;
          token.name = dbUser.firstName;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as { id: string }).id = token.userId as string;
        (session.user as unknown as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: withBasePath("/login"),
    error: withBasePath("/login"),
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
});
