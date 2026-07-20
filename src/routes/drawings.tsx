import { createFileRoute } from "@tanstack/react-router";
import { FileText, Eye, GitBranch } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTable } from "@/components/CrudTable";
import { useCrudStore } from "@/lib/crud-store";
import { KEYS, drawingsSeed } from "@/lib/dcems-data";

export const Route = createFileRoute("/drawings")({
  head: () => ({ meta: [{ title: "Drawings — DCEMS" }, { name: "description", content: "Electrical drawings and revisions." }] }),
  component: DrawingsPage,
});

const tone: Record<string, string> = {
  Approved: "bg-[color:var(--success)]/20 text-[color:var(--success)] border-[color:var(--success)]/30",
  "For Review": "bg-[color:var(--warning)]/20 text-[color:var(--warning)] border-[color:var(--warning)]/30",
  IFC: "bg-primary/20 text-primary border-primary/30",
  Superseded: "bg-muted text-muted-foreground border-border",
};

function DrawingsPage() {
  const rows = useCrudStore(KEYS.drawings, drawingsSeed);
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const revs = Array.from(new Set(rows.map((r) => String(r.rev ?? "")))).filter(Boolean).sort();
  const revRange = revs.length ? `${revs[0]}–${revs[revs.length - 1]}` : "—";

  const stats = [
    { label: "Total Drawings", value: String(rows.length), icon: FileText },
    { label: "Approved", value: String(count("Approved")), icon: FileText },
    { label: "For Review", value: String(count("For Review")), icon: Eye },
    { label: "Revisions", value: revRange, icon: GitBranch },
  ];

  return (
    <DashboardLayout title="Drawings">
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
          storageKey={KEYS.drawings}
          title="Drawing Register"
          seed={drawingsSeed}
          fields={[
            { key: "no", label: "Drawing No.", mono: true },
            { key: "title", label: "Title" },
            { key: "rev", label: "Rev" },
            { key: "discipline", label: "Discipline", type: "select", options: ["Electrical", "ELV", "Mechanical", "Civil"], muted: true },
            { key: "status", label: "Status", type: "select", options: ["IFC", "For Review", "Approved", "Superseded"], tone },
            { key: "date", label: "Date", muted: true },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
