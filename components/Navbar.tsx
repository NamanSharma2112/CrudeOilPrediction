"use client"

import { usePathname } from "next/navigation"
import { Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./theme"
import { SidebarTrigger } from "./ui/sidebar"
import { navItemFor, REPO_URL } from "@/app/libs/nav"
import { UserMenu, type SessionUser } from "./UserMenu"

const Navbar = ({ user }: { user: SessionUser | null }) => {
  const page = navItemFor(usePathname())

  return (
    <nav className="flex items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />
        {page && (
          <span className="truncate text-sm text-muted-foreground">
            CrudeIQ <span className="px-1">/</span>
            <span className="text-foreground">{page.title}</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
        <Button variant="outline" size="icon" asChild>
          <a href={REPO_URL} target="_blank" rel="noreferrer" aria-label="Source code on GitHub">
            <Github className="size-[1.2rem]" />
          </a>
        </Button>
        <UserMenu user={user} />
      </div>
    </nav>
  )
}

export default Navbar
