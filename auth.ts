/**
 * Optional sign-in (Auth.js / NextAuth v5). Nothing in the app requires it.
 *
 * Enabled when AUTH_SECRET and at least one provider's keys are set:
 *   GitHub: AUTH_GITHUB_ID, AUTH_GITHUB_SECRET
 *   Google: AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
 * Sessions are signed JWT cookies, so no database is needed.
 */

import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import type { Provider } from "next-auth/providers"

const available: { id: string; name: string; provider: Provider; envReady: boolean }[] = [
  {
    id: "github",
    name: "GitHub",
    provider: GitHub,
    envReady: Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
  },
  {
    id: "google",
    name: "Google",
    provider: Google,
    envReady: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  },
]

const enabled = available.filter((p) => p.envReady)

/** Providers the login page can offer. */
export const authProviders = enabled.map(({ id, name }) => ({ id, name }))

/** True when sign-in is configured; when false, never call auth(). */
export const authEnabled = Boolean(process.env.AUTH_SECRET) && enabled.length > 0

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: enabled.map((p) => p.provider),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
})

/** The signed-in user, or null when signed out or when auth isn't configured. */
export async function currentUser() {
  if (!authEnabled) return null
  try {
    const session = await auth()
    return session?.user ?? null
  } catch (error) {
    console.error("[auth] Could not read session:", error)
    return null
  }
}
