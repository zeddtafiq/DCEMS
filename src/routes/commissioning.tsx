import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ClipboardCheck, Power, Handshake } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTable } from "@/components/CrudTable";
import { useCrudStore } from "@/lib/crud-store";
import { KEYS, commissioningSeed } from "@/lib/dcems-data";

export const Route = createFileRoute("/commissioning")({
  head: () => ({ meta: [{ title: "Commissioning — DCEMS" }, { name: "description", content: "Commissioning progress and handover." }] }),
  component: CommissioningPage,
});

const stageTone: Record<string, string> = {
  "Handed Over": "bg-[color:var(--success)]/20 text-[color:var(--success)] border-[color:var(--success)]/30",
  Energized: "bg-primary/20 text-primary border-primary/30",
  "Live Trials": "bg-primary/20 text-primary border-primary/30",
  "Testing Complete": "bg-primary/20 text-primary border-primary/30",
  Energization: "bg-[color:var(--warning)]/20 text-[color:var(--warning)] border-[color:var(--warning)]/30",
  SAT: "bg-[color:var(--warning)]/20 text-[color:var(--warning)] border-[color:var(--warning)]/30",
  "Load Bank": "bg-[color:var(--warning)]/20 text-[color:var(--warning)] border-[color:var(--warning)]/30",
  Integration: "bg-[color:var(--warning)]/20 text-[color:var(--warning)] border-[color:var(--warning)]/30",
};

function CommissioningPage() {
  const rows = useCrudStore(KEYS.commissioning, commissioningSeed);
  const avg = rows.length
    ? Math.round(rows.reduce((s, r) => s + Number(r.pct ?? 0), 0) / rows.length)
    : 0;
  const ready = rows.filter((r) => Number(r.pct ?? 0) >= 80).length;
  const energized = rows.filter((r) => r.stage === "Energized").length;
  const handed = rows.filter((r) => r.stage === "Handed Over").length;

  const stats = [
    { label: "Overall Progress", value: `${avg}%`, icon: CheckCircle2 },
    { label: "Systems Ready", value: `${ready} / ${rows.length}`, icon: ClipboardCheck },
    { label: "Energized", value: String(energized), icon: Power },
    { label: "Handed Over", value: String(handed), icon: Handshake },
  ];

  return (
    <DashboardLayout title="Commissioning">
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
          storageKey={KEYS.commissioning}
          title="Systems Commissioning"
          seed={commissioningSeed}
          fields={[
            { key: "name", label: "System" },
            { key: "pct", label: "Progress %", type: "number" },
            {
              key: "stage",
              label: "Stage",
              type: "select",
              options: ["SAT", "Load Bank", "Integration", "Energization", "Testing Complete", "Live Trials", "Energized", "Handed Over"],
              tone: stageTone,
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
