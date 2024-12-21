import * as React from "react"

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import * as Icons from "lucide-react";
import { SingleMenuType } from '@/types/SingleMenuType';

export function NavSecondary({
    items: items,
    ...props
}: {
    items: SingleMenuType
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
    return (
        <SidebarGroup {...props}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.menus.map((item) => {
                        const Icon = Icons[item.icon] as React.ElementType; // Garante que é um componente válido
                        if (!Icon) {
                            console.warn(`Ícone ${item.icon} não encontrado ou inválido.`);
                            return null;
                        }
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild size="sm">
                                    <a href={item.url}>
                                        <Icon className="icon" />
                                        <span>{item.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
