import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const providers: NextAuthConfig["providers"] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers,
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isProtected = [
        "/home",
        "/discover",
        "/watchlist",
        "/watched",
        "/analytics",
        "/profile",
        "/settings",
        "/onboarding",
        "/search",
        "/notifications",
        "/admin",
      ].some((path) => pathname === path || pathname.startsWith(`${path}/`));

      if (isProtected && !auth?.user) return false;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
