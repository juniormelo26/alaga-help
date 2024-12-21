import * as React from "react"
import {
    Command,
} from "lucide-react"

import { DropDownMenu } from "@/components/dashboard/menu-item/dropdown-menu"
import { NavSecondary } from "@/components/dashboard/menu-item/nav-secondary"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { aboutMenu, followUpMenu, infrastructureMenu, singleMenu } from '@/config/menus'
import { SingleMenu } from './menu-item/single-menu'
import { auth } from '@/services/auth'
import { NavUser } from './nav-user'

export async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const session = await auth();

    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="#">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Alaga Help</span>
                                    <span className="truncate text-xs">Prevenção de Catastrofes</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SingleMenu items={singleMenu} />
                <DropDownMenu items={followUpMenu} />
                <DropDownMenu items={infrastructureMenu} />
                <NavSecondary items={aboutMenu} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser
                    user={{
                        name: session?.user?.name || "Guest",
                        email: session?.user?.email || "guest@example.com",
                        avatar: session?.user?.image || "/default-avatar.png",
                    }}
                />
            </SidebarFooter>
        </Sidebar>
    )
}
