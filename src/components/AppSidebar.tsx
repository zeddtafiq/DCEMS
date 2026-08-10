import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";


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
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const { signOut } = await import("firebase/auth");
    const { firebaseAuth } = await import("@/lib/firebase");
    await signOut(firebaseAuth).catch(() => {});
    const { error } = await supabase.auth.signOut();
    if (error) return toast.error(error.message);
    toast.success("Signed out");
    navigate({ to: "/auth" });
  }


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
        {email && (
          <div className="truncate px-3 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            {email}
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            {email ? (
              <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton asChild tooltip="Sign in">
                <Link to="/auth">
                  <LogIn />
                  <span>Sign in</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

