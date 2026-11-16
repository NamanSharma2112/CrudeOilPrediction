"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Droplet, ExternalLink } from "lucide-react"
import { motion, type Easing } from "motion/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "./ui/sidebar"
import { CommandMenu } from "./ui/Cmd"
import { DASHBOARD_NAV, HELP_NAV, REPO_URL, type NavItem } from "@/app/libs/nav"

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeInOut" as Easing },
  }),
}

function NavLinks({ items, offset = 0 }: { items: NavItem[]; offset?: number }) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarMenu>
      {items.map((item, i) => (
        <motion.li
          key={item.url}
          data-sidebar="menu-item"
          className="group/menu-item relative"
          custom={i + offset}
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
            <Link href={item.url} onClick={() => isMobile && setOpenMobile(false)}>
              <item.icon />
              <span className="truncate">{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </motion.li>
      ))}
    </SidebarMenu>
  )
}

const AppSidebar = () => {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="mt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="CrudeIQ">
              <Link href="/">
                <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-black">
                  <Droplet className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate font-semibold">CrudeIQ</span>
                  <span className="truncate text-xs text-muted-foreground">Oil market intelligence</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <CommandMenu />
          <SidebarGroupLabel className="mt-2">Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavLinks items={DASHBOARD_NAV} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Help</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavLinks items={HELP_NAV} offset={DASHBOARD_NAV.length} />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Source code">
                  <a href={REPO_URL} target="_blank" rel="noreferrer">
                    <ExternalLink />
                    <span className="truncate">Source code</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 pb-2 text-xs leading-snug text-muted-foreground group-data-[collapsible=icon]:hidden">
          Prices are delayed. For information only, not investment advice.
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
