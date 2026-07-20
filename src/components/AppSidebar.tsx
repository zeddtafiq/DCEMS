import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  FolderKanban,
  Zap,
  Package,
  FileText,
  ListChecks,
  FlaskConical,
  CheckCircle2,
  LineChart,
  Folder,
  Server,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Equipment", url: "/equipment", icon: Zap },
  { title: "Materials", url: "/materials", icon: Package },
  { title: "Drawings", url: "/drawings", icon: FileText },
  { title: "Inspection", url: "/inspection", icon: ListChecks },
  { title: "Testing", url: "/testing", icon: FlaskConical },
  { title: "Commissioning", url: "/commissioning", icon: CheckCircle2 },
  { title: "Reports", url: "/reports", icon: LineChart },
  { title: "Documents", url: "/documents", icon: Folder },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Server className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-primary group-data-[collapsible=icon]:hidden">
            DCEMS
          </h2>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
