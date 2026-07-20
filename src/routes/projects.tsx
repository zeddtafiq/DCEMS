import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban, Calendar, Users, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTable } from "@/components/CrudTable";
import { useCrudStore } from "@/lib/crud-store";
import { KEYS, projectsSeed } from "@/lib/dcems-data";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Projects — DCEMS" }, { name: "description", content: "Active electrical projects." }] }),
  component: ProjectsPage,
});

const statusTone: Record<string, string> = {
  "On Track": "bg-[color:var(--success)]/20 text-[color:var(--success)] border-[color:var(--success)]/30",
  Delayed: "bg-destructive/20 text-destructive border-destructive/30",
  "At Risk": "bg-[color:var(--warning)]/20 text-[color:var(--warning)] border-[color:var(--warning)]/30",
};

function ProjectsPage() {
  const rows = useCrudStore(KEYS.projects, projectsSeed);
  const totalTeam = rows.reduce((s, r) => s + Number(r.team ?? 0), 0);
  const avgProgress = rows.length
    ? Math.round(rows.reduce((s, r) => s + Number(r.progress ?? 0), 0) / rows.length)
    : 0;
  const dueThisYear = rows.filter((r) => String(r.due ?? "").startsWith("2026")).length;

  const stats = [
    { label: "Active Projects", value: String(rows.length), icon: FolderKanban },
    { label: "Total Team", value: String(totalTeam), icon: Users },
    { label: "Avg. Progress", value: `${avgProgress}%`, icon: TrendingUp },
    { label: "Due This Year", value: String(dueThisYear), icon: Calendar },
  ];

  return (
    <DashboardLayout title="Projects">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{s.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <CrudTable
          storageKey={KEYS.projects}
          title="Project Register"
          seed={projectsSeed}
          fields={[
            { key: "name", label: "Project", required: true },
            { key: "client", label: "Client" },
            { key: "manager", label: "Manager" },
            { key: "team", label: "Team", type: "number" },
            { key: "due", label: "Due Date", muted: true },
            { key: "progress", label: "Progress %", type: "number" },
            { key: "status", label: "Status", type: "select", options: ["On Track", "At Risk", "Delayed"], tone: statusTone },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
