import { LogOut, Moon, Settings, User } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from './theme'
import { SidebarTrigger } from './ui/sidebar'

const Navbar = () => {
  return (
    <nav className='p-4 flex items-center justify-between'>
      <SidebarTrigger/>
      <div className='flex items-center gap-4'>
      <Link href="/">Dashboard</Link>
      <ModeToggle />
  
<DropdownMenu>
  <DropdownMenuTrigger>
        <Avatar>
  <AvatarImage src="https://github.com/shadcn.png" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>
  </DropdownMenuTrigger>
  <DropdownMenuContent sideOffset={10} className='mr-4 transition-all duration-350 ease-in-out'>
    <DropdownMenuGroup>
      <DropdownMenuLabel>My Account</DropdownMenuLabel>
      <DropdownMenuItem><User className='h-[1.2rem] w-[1.2rem] mr-2'/>Profile</DropdownMenuItem>
      <DropdownMenuItem><Settings className='h-[1.2rem] w-[1.2rem] mr-2' />Settings</DropdownMenuItem>
      <DropdownMenuItem variant="destructive"><LogOut className='h-[1.2rem] w-[1.2rem] mr-2'/>Logout</DropdownMenuItem>
    </DropdownMenuGroup>
   
  </DropdownMenuContent>
</DropdownMenu>
      </div>
    </nav>
  )
}

export default Navbar
