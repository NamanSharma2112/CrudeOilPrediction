import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Droplet, Github } from "lucide-react"
import { authEnabled, authProviders, currentUser } from "@/auth"
import { signInWith } from "@/app/libs/auth-actions"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Sign in · CrudeIQ" }

const ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "That email is already linked to a different sign-in method. Use the one you signed up with.",
  AccessDenied: "Sign-in was cancelled or denied.",
  Configuration: "Sign-in isn't configured correctly on the server.",
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6c-.3 1.4-1 2.5-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.7 3.2-8z" />
      <path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.7c-1 .7-2.2 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.3v2.8C4.1 20.8 7.8 23 12 23z" />
      <path fill="#FBBC05" d="M6 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.6.4-2.4V6.9H2.3C1.5 8.4 1 10.1 1 12s.5 3.6 1.3 5.1L6 14.4z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.4 2.2 14.9 1 12 1 7.8 1 4.1 3.2 2.3 6.9L6 9.6c.9-2.5 3.2-4.2 6-4.2z" />
    </svg>
  )
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const { callbackUrl, error } = await searchParams
  const target = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/"

  if (await currentUser()) redirect(target)

  return (
    <main className="flex min-h-[70vh] items-center justify-center pb-8">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-xl border bg-primary-foreground p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-10 items-center justify-center rounded-lg bg-amber-500 text-black">
            <Droplet className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Sign in to CrudeIQ</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Optional. Every page works without an account.
            </p>
          </div>
        </div>

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {ERRORS[error] ?? "Sign-in failed. Please try again."}
          </p>
        )}

        {authEnabled ? (
          <div className="flex flex-col gap-2">
            {authProviders.map((p) => (
              <form key={p.id} action={signInWith.bind(null, p.id, target)}>
                <Button type="submit" variant="outline" className="w-full gap-2">
                  {p.id === "github" ? <Github className="size-4" /> : <GoogleIcon />}
                  Continue with {p.name}
                </Button>
              </form>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Sign-in isn&apos;t set up on this deployment yet.</p>
            <p>
              The site owner can enable it by setting <code>AUTH_SECRET</code> plus <code>AUTH_GITHUB_ID</code> and{" "}
              <code>AUTH_GITHUB_SECRET</code> (or the Google equivalents). See the README.
            </p>
          </div>
        )}

        <Link href={target} className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Continue without signing in
        </Link>
      </div>
    </main>
  )
}
