import React from 'react'
import {Home, Inbox, Calendar, Search, Settings, Sidebar} from "lucide-react"
import { SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import Link from 'next/link'
const items = [
  {title:"Home",
    url:"/",
    icon:Home,
  },
{
  title:"Inbox",
  url:"/inbox",
  icon:Inbox,
},
{
  title:"Calendar",
  url:"/calendar",
  icon:Calendar,
},{
  title:"Search",
  url:"/search",
  icon:Search,
},
{
  title:"Settings",
  url:"/settings",
  icon:Settings,
},
];
const AppSidebar = () => {
  return (
  <Sidebar>
      <SidebarHeader> </SidebarHeader>
<SidebarContent>
<SidebarGroup>
  <SidebarGroupLabel>  Application </SidebarGroupLabel>
  <SidebarGroupContent>
    <SidebarMenu>
      {items.map(item=>(
        <SidebarMenuItem key={item.title}>
<SidebarMenuButton asChild>
  <Link href={item.url}>
  <item.icon/>
  <span>{item.title}</span>
  </Link>
</SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  </SidebarGroupContent>
</SidebarGroup>
</SidebarContent>
<SidebarFooter></SidebarFooter>

    </Sidebar>
  );
};

export default AppSidebar
