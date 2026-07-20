import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Zap, Gauge, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CrudTable } from "@/components/CrudTable";
import { useCrudStore } from "@/lib/crud-store";
import { KEYS, testingSeed } from "@/lib/dcems-data";

export const Route = createFileRoute("/testing")({
  head: () => ({ meta: [{ title: "Testing — DCEMS" }, { name: "description", content: "Electrical testing records." }] }),
  component: TestingPage,
});

const tone: Record<string, string> = {
  Pass: "bg-[color:var(--success)]/20 text-[color:var(--success)] border-[color:var(--success)]/30",
  Fail: "bg-destructive/20 text-destructive border-destructive/30",
  Retest: "bg-[color:var(--warning)]/20 text-[color:var(--warning)] border-[color:var(--warning)]/30",
};

function TestingPage() {
  const rows = useCrudStore(KEYS.testing, testingSeed);
  const passed = rows.filter((r) => r.result === "Pass").length;
  const hv = rows.filter((r) => /hi-pot|ttr|insulation|kv/i.test(String(r.test ?? ""))).length;
  const passRate = rows.length ? Math.round((passed / rows.length) * 100) : 0;

  const stats = [
    { label: "Tests Executed", value: String(rows.length), icon: FlaskConical },
    { label: "HV Tests", value: String(hv), icon: Zap },
    { label: "Measurements", value: String(rows.length), icon: Gauge },
    { label: "Pass Rate", value: `${passRate}%`, icon: ShieldCheck },
  ];

  return (
    <DashboardLayout title="Testing">
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

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {[
          { name: "MV Testing", pct: 88 },
          { name: "LV Testing", pct: 72 },
          { name: "ELV / Fire Alarm", pct: 55 },
        ].map((c) => (
          <Card key={c.name}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{c.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-semibold">{c.pct}%</span>
              </div>
              <Progress value={c.pct} className="mt-2 h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <CrudTable
          storageKey={KEYS.testing}
          title="Test Results"
          seed={testingSeed}
          fields={[
            { key: "id", label: "ID", mono: true },
            { key: "equipment", label: "Equipment" },
            { key: "test", label: "Test" },
            { key: "value", label: "Value", mono: true },
            { key: "limit", label: "Limit", mono: true, muted: true },
            { key: "result", label: "Result", type: "select", options: ["Pass", "Fail", "Retest"], tone },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
