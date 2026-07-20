import { createFileRoute } from "@tanstack/react-router";
import { Zap, CheckCircle2, Wrench, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTable } from "@/components/CrudTable";
import { useCrudStore } from "@/lib/crud-store";
import { KEYS, equipmentSeed } from "@/lib/dcems-data";

export const Route = createFileRoute("/equipment")({
  head: () => ({ meta: [{ title: "Equipment — DCEMS" }, { name: "description", content: "Installed electrical equipment register." }] }),
  component: EquipmentPage,
});

const tone: Record<string, string> = {
  Commissioned: "bg-[color:var(--success)]/20 text-[color:var(--success)] border-[color:var(--success)]/30",
  Testing: "bg-[color:var(--warning)]/20 text-[color:var(--warning)] border-[color:var(--warning)]/30",
  Installed: "bg-primary/20 text-primary border-primary/30",
  Delivered: "bg-muted text-muted-foreground border-border",
  Faulty: "bg-destructive/20 text-destructive border-destructive/30",
};

function EquipmentPage() {
  const rows = useCrudStore(KEYS.equipment, equipmentSeed);
  const count = (s: string) => rows.filter((r) => r.status === s).length;

  const stats = [
    { label: "Total Equipment", value: String(rows.length), icon: Zap },
    { label: "Commissioned", value: String(count("Commissioned")), icon: CheckCircle2 },
    { label: "Under Testing", value: String(count("Testing")), icon: Wrench },
    { label: "Issues", value: String(count("Faulty")), icon: AlertTriangle },
  ];

  return (
    <DashboardLayout title="Equipment">
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
          storageKey={KEYS.equipment}
          title="Equipment Register"
          seed={equipmentSeed}
          fields={[
            { key: "tag", label: "Tag", mono: true },
            { key: "name", label: "Name" },
            { key: "vendor", label: "Vendor", muted: true },
            { key: "location", label: "Location", muted: true },
            { key: "status", label: "Status", type: "select", options: ["Delivered", "Installed", "Testing", "Commissioned", "Faulty"], tone },
            { key: "installed", label: "Installed", muted: true },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
