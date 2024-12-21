"use client"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {

    SidebarTrigger,
} from "@/components/ui/sidebar"
import { usePathname } from 'next/navigation'
import React from 'react'

export const NavHeader = () => {

     const pathname = usePathname();
        const segments = pathname
            .replace(/^\/app/, "")
            .split("/")
            .filter(Boolean);
    
        const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

    return (
        <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        {segments.map((segment, index) => {
                            const isLast = index === segments.length - 1;
                            const path = "/app/" + segments.slice(0, index + 1).join("/");

                            return (
                                <React.Fragment key={path}>
                                    <BreadcrumbItem key={path}>
                                        {isLast ? (
                                            <BreadcrumbLink href={path}>
                                                {capitalize(segment)}
                                            </BreadcrumbLink>
                                        ) : (
                                            <BreadcrumbPage>{capitalize(segment)}</BreadcrumbPage>
                                        )}
                                    </BreadcrumbItem >
                                    {!isLast && <BreadcrumbSeparator key={`separator-${index}`} />}
                                </React.Fragment>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
        </header>
    );
};