import type { ReactNode } from "react";
import { UserCircle2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

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
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/70 px-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="transition-transform duration-200 hover:scale-110" />
              <h1 className="text-2xl font-semibold tracking-tight gradient-text">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="hidden items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground sm:flex">
                <UserCircle2 className="h-5 w-5 text-primary" />
                <span>Electrical Engineer</span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 animate-fade-up">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
