import { createFileRoute } from "@tanstack/react-router";
import { LineChart as LineIcon, Download, FileBarChart, Calendar } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTable } from "@/components/CrudTable";
import { useCrudStore } from "@/lib/crud-store";
import { KEYS, reportsSeed, commissioningSeed } from "@/lib/dcems-data";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — DCEMS" }, { name: "description", content: "Daily and progress reports." }] }),
  component: ReportsPage,
});

const typeTone: Record<string, string> = {
  Daily: "bg-primary/20 text-primary border-primary/30",
  Weekly: "bg-[color:var(--warning)]/20 text-[color:var(--warning)] border-[color:var(--warning)]/30",
  Monthly: "bg-[color:var(--success)]/20 text-[color:var(--success)] border-[color:var(--success)]/30",
  Milestone: "bg-[color:var(--success)]/20 text-[color:var(--success)] border-[color:var(--success)]/30",
  QA: "bg-destructive/20 text-destructive border-destructive/30",
};

function ReportsPage() {
  const rows = useCrudStore(KEYS.reports, reportsSeed);
  const commissioning = useCrudStore(KEYS.commissioning, commissioningSeed);
  const thisMonth = rows.filter((r) => String(r.date ?? "").startsWith("2026-07")).length;
  const actualAvg = commissioning.length
    ? Math.round(commissioning.reduce((s, r) => s + Number(r.pct ?? 0), 0) / commissioning.length)
    : 0;

  // Derive planned vs actual trend from live commissioning avg (final point).
  const trend = [
    { week: "W1", planned: 10, actual: 8 },
    { week: "W2", planned: 20, actual: 17 },
    { week: "W3", planned: 32, actual: 30 },
    { week: "W4", planned: 45, actual: 42 },
    { week: "W5", planned: 58, actual: 55 },
    { week: "W6", planned: 70, actual: 68 },
    { week: "W7", planned: 82, actual: 78 },
    { week: "W8", planned: 92, actual: actualAvg },
  ];

  const stats = [
    { label: "Reports YTD", value: String(rows.length), icon: FileBarChart },
    { label: "This Month", value: String(thisMonth), icon: Calendar },
    { label: "Commissioning", value: `${actualAvg}%`, icon: LineIcon },
    { label: "Exports", value: String(rows.length * 3), icon: Download },
  ];

  return (
    <DashboardLayout title="Reports">
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

      <Card className="mt-6">
        <CardHeader><CardTitle>Planned vs Actual Progress</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" }} />
                <Line type="monotone" dataKey="planned" stroke="var(--muted-foreground)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="actual" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <CrudTable
          storageKey={KEYS.reports}
          title="Recent Reports"
          seed={reportsSeed}
          fields={[
            { key: "id", label: "ID", mono: true },
            { key: "title", label: "Title" },
            { key: "author", label: "Author", muted: true },
            { key: "type", label: "Type", type: "select", options: ["Daily", "Weekly", "Monthly", "Milestone", "QA"], tone: typeTone },
            { key: "date", label: "Date", muted: true },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
