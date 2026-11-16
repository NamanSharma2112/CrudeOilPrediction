"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { CommandIcon, ExternalLink, Moon, PanelLeft, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useSidebar } from "@/components/ui/sidebar"
import { DASHBOARD_NAV, HELP_NAV, REPO_URL } from "@/app/libs/nav"

/** ⌘K / Ctrl+K command palette: jump to any page, switch theme, open the repo. */
export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { setTheme } = useTheme()
  const { toggleSidebar } = useSidebar()

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const run = (fn: () => void) => {
    setOpen(false)
    fn()
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="w-full justify-start gap-2 text-muted-foreground group-data-[collapsible=icon]:hidden"
      >
        <CommandIcon className="size-4" />
        <span className="flex-1 text-left">Search pages…</span>
        <kbd className="rounded border px-1.5 font-mono text-[10px]">⌘K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Go to a page or run a command…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Pages">
              {[...DASHBOARD_NAV, ...HELP_NAV].map((item) => (
                <CommandItem
                  key={item.url}
                  value={`${item.title} ${item.description}`}
                  onSelect={() => run(() => router.push(item.url))}
                >
                  <item.icon />
                  <span>{item.title}</span>
                  <span className="ml-2 truncate text-xs text-muted-foreground">{item.description}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => run(() => setTheme("light"))}>
                <Sun />
                <span>Light theme</span>
              </CommandItem>
              <CommandItem onSelect={() => run(() => setTheme("dark"))}>
                <Moon />
                <span>Dark theme</span>
              </CommandItem>
              <CommandItem onSelect={() => run(toggleSidebar)}>
                <PanelLeft />
                <span>Toggle sidebar</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => run(() => window.open(REPO_URL, "_blank", "noreferrer"))}>
                <ExternalLink />
                <span>Open source code on GitHub</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
