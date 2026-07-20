import { createFileRoute } from "@tanstack/react-router";
import { ListChecks, CheckCircle2, XCircle, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTable } from "@/components/CrudTable";
import { useCrudStore } from "@/lib/crud-store";
import { KEYS, inspectionsSeed } from "@/lib/dcems-data";

export const Route = createFileRoute("/inspection")({
  head: () => ({ meta: [{ title: "Inspection — DCEMS" }, { name: "description", content: "Inspection checklists and results." }] }),
  component: InspectionPage,
});

const tone: Record<string, string> = {
  Passed: "bg-[color:var(--success)]/20 text-[color:var(--success)] border-[color:var(--success)]/30",
  Failed: "bg-destructive/20 text-destructive border-destructive/30",
  Pending: "bg-[color:var(--warning)]/20 text-[color:var(--warning)] border-[color:var(--warning)]/30",
};

function InspectionPage() {
  const rows = useCrudStore(KEYS.inspections, inspectionsSeed);
  const count = (r: string) => rows.filter((x) => x.result === r).length;

  const stats = [
    { label: "Total Inspections", value: String(rows.length), icon: ListChecks },
    { label: "Passed", value: String(count("Passed")), icon: CheckCircle2 },
    { label: "Failed", value: String(count("Failed")), icon: XCircle },
    { label: "Pending", value: String(count("Pending")), icon: Clock },
  ];

  return (
    <DashboardLayout title="Inspection">
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
          storageKey={KEYS.inspections}
          title="Recent Inspections"
          seed={inspectionsSeed}
          fields={[
            { key: "id", label: "ID", mono: true },
            { key: "equipment", label: "Equipment" },
            { key: "type", label: "Type", muted: true },
            { key: "inspector", label: "Inspector" },
            { key: "date", label: "Date", muted: true },
            { key: "result", label: "Result", type: "select", options: ["Pending", "Passed", "Failed"], tone },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
