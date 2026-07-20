import type { ReactNode } from "react";
import { UserCircle2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface Props {
  title: string;
  children: ReactNode;
}

export function DashboardLayout({ title, children }: Props) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-border px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h1 className="text-2xl font-semibold">{title}</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserCircle2 className="h-6 w-6" />
              <span>Electrical Engineer</span>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
