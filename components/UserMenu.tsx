"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogIn, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOutUser } from "@/app/libs/auth-actions"

export interface SessionUser {
  name?: string | null
  email?: string | null
  image?: string | null
}

function initials(user: SessionUser) {
  const source = user.name || user.email || "?"
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("")
}

export function UserMenu({ user }: { user: SessionUser | null }) {
  const pathname = usePathname()

  if (!user) {
    if (pathname === "/login") return null
    return (
      <Button variant="outline" asChild>
        <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}>
          <LogIn className="size-4" />
          Sign in
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2" aria-label="Account menu">
        <Avatar>
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback>{initials(user)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-52">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate">{user.name ?? "Signed in"}</span>
          {user.email && <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action={signOutUser}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut className="size-4" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
