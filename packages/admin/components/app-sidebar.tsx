"use client";

import * as React from "react";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useCurrentRole } from "@/hooks/use-current-role";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  UsersIcon,
  FileTextIcon,
  VideoIcon,
  WalletIcon,
  MonitorIcon,
  CreditCardIcon,
  Settings2Icon,
  ScrollTextIcon,
  ShieldCheckIcon,
  SendIcon,
} from "lucide-react";
import { hasPermission, type UserRole } from "@trafferbot/shared/constants";

// Map page URLs to required permissions (null = no specific permission needed)
const PAGE_PERMISSIONS: Record<string, string | null> = {
  "/": null,
  "/users": "users.view",
  "/applications": "applications.review",
  "/videos": "videos.review",
  "/withdrawals": "withdrawals.process",
  "/platforms": "platforms.manage",
  "/withdrawal-methods": "withdrawal_methods.manage",
  "/permissions": "settings.manage",
  "/settings": "settings.manage",
  "/logs": "logs.view",
};

const ROLE_LABELS: Record<string, string> = {
  shnyr: "Шнырь",
  traffer: "Траффер",
  moderator: "Модератор",
  financier: "Финансист",
  owner: "Владелец",
};

function canAccess(role: UserRole, url: string): boolean {
  const perm = PAGE_PERMISSIONS[url];
  if (perm === null || perm === undefined) return true;
  return hasPermission(role, perm);
}

const allNavMain = [
  {
    title: "Основное",
    url: "/",
    icon: <LayoutDashboardIcon />,
    isActive: true,
    items: [
      { title: "Dashboard", url: "/" },
      { title: "Пользователи", url: "/users" },
      { title: "Заявки", url: "/applications" },
      { title: "Видео", url: "/videos" },
      { title: "Выводы", url: "/withdrawals" },
    ],
  },
  {
    title: "Управление",
    url: "/platforms",
    icon: <Settings2Icon />,
    items: [
      { title: "Платформы", url: "/platforms" },
      { title: "Способы вывода", url: "/withdrawal-methods" },
      { title: "Права ролей", url: "/permissions" },
      { title: "Настройки", url: "/settings" },
      { title: "Логи", url: "/logs" },
    ],
  },
];

const allProjects = [
  { name: "Пользователи", url: "/users", icon: <UsersIcon /> },
  { name: "Заявки", url: "/applications", icon: <FileTextIcon /> },
  { name: "Видео", url: "/videos", icon: <VideoIcon /> },
  { name: "Выводы", url: "/withdrawals", icon: <WalletIcon /> },
  { name: "Платформы", url: "/platforms", icon: <MonitorIcon /> },
  { name: "Способы вывода", url: "/withdrawal-methods", icon: <CreditCardIcon /> },
  { name: "Права ролей", url: "/permissions", icon: <ShieldCheckIcon /> },
  { name: "Логи", url: "/logs", icon: <ScrollTextIcon /> },
];

const teams = [
  {
    name: "TrafferBot",
    logo: <SendIcon />,
    plan: "Admin Panel",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const { role } = useCurrentRole();

  const user = {
    name: session?.user?.name ?? "Admin",
    email: ROLE_LABELS[role] ?? role,
    avatar: session?.user?.image ?? "",
  };

  const navMain = useMemo(() =>
    allNavMain
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => canAccess(role, item.url)),
      }))
      .filter((group) => group.items.length > 0),
    [role]
  );

  const projects = useMemo(() =>
    allProjects.filter((p) => canAccess(role, p.url)),
    [role]
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
