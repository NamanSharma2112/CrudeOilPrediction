"use client"
import { Calendar, ChevronUp, Home, Inbox, Search, Settings, User2 } from "lucide-react"
import { motion } from "motion/react"  

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
} from "./ui/sidebar"
import Link from "next/link"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

const items = [
  { title: "Home",     url: "/",  icon: Home },
  { title: "Inbox",    url: "#",  icon: Inbox },
  { title: "Calendar", url: "#",  icon: Calendar },
  { title: "Search",   url: "#",  icon: Search },
  { title: "Settings", url: "#",  icon: Settings },
]


const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.07,       
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1], 
    },
  }),
}

const AppSidebar = () => {
  return (
    <Sidebar>
      
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <SidebarHeader className="mt-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/">
                  <Image
                    src="https://github.com/shadcn.png"
                    alt="logo"
                    width={30}
                    height={30}
                    className="rounded-full object-cover"
                  />
                  <span>Legion Dev</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
      </motion.div>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item, i) => (
                // motion.li is a drop-in for the li that SidebarMenuItem renders
                <motion.li
                  key={item.title}
                  custom={i}                  // passes `i` into the `visible` variant
                  initial="hidden"
                  animate="visible"
                  variants={itemVariants}
                >
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </motion.li>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: items.length * 0.07 + 0.2, duration: 0.4 }}
      >
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <User2 />
                    <span>John Doe</span>
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width] transition-all duration-300 ease-in-out"
                >
                  <DropdownMenuItem><span>Profile</span></DropdownMenuItem>
                  <DropdownMenuItem><span>Billing</span></DropdownMenuItem>
                  <DropdownMenuItem><span>Sign out</span></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </motion.div>
    </Sidebar>
  )
}

export default AppSidebar