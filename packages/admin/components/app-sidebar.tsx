"use client";

import * as React from "react";
import {
  BarChartIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MonitorPlayIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
  WalletIcon,
  ScrollTextIcon,
  ServerIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Users",
    url: "/users",
    icon: UsersIcon,
  },
  {
    title: "Applications",
    url: "/applications",
    icon: FileTextIcon,
  },
  {
    title: "Videos",
    url: "/videos",
    icon: MonitorPlayIcon,
  },
  {
    title: "Withdrawals",
    url: "/withdrawals",
    icon: WalletIcon,
  },
  {
    title: "Withdrawal Methods",
    url: "/withdrawal-methods",
    icon: BarChartIcon,
  },
  {
    title: "Platforms",
    url: "/platforms",
    icon: ServerIcon,
  },
  {
    title: "Permissions",
    url: "/permissions",
    icon: ShieldIcon,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: SettingsIcon,
  },
  {
    title: "Audit Logs",
    url: "/logs",
    icon: ScrollTextIcon,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <BarChartIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">TrafferBot</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Admin Panel
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={navItems.map((item) => ({
            ...item,
            isActive: pathname === item.url,
          }))}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
