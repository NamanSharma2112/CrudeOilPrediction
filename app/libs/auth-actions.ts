"use server"

import { authEnabled, authProviders, signIn, signOut } from "@/auth"

export async function signInWith(provider: string, redirectTo: string = "/") {
  if (!authEnabled || !authProviders.some((p) => p.id === provider)) {
    throw new Error(`Sign-in with ${provider} is not configured.`)
  }
  // Only allow same-site relative redirects.
  const target = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/"
  await signIn(provider, { redirectTo: target })
}

export async function signOutUser() {
  if (!authEnabled) return
  await signOut({ redirectTo: "/" })
}
