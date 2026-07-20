import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2 } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useCrudStore } from "@/lib/crud-store";
import {
  KEYS,
  projectsSeed,
  equipmentSeed,
  inspectionsSeed,
  commissioningSeed,
} from "@/lib/dcems-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DCEMS Dashboard — Electrical Commissioning" },
      {
        name: "description",
        content:
          "DCEMS dashboard for tracking electrical projects, equipment, inspection, testing and commissioning.",
      },
      { property: "og:title", content: "DCEMS Dashboard — Electrical Commissioning" },
      {
        property: "og:description",
        content: "DCEMS dashboard for tracking electrical projects, equipment, inspection, testing and commissioning.",
      },
    ],
  }),
  component: Dashboard,
});

const tasks = [
  "Transformer T1 Inspection",
  "RMU Functional Test",
  "Upload Daily Report",
  "LV Panel Commissioning",
  "Busduct Torque Check",
];

const equipmentTone: Record<string, string> = {
  Commissioned: "text-[color:var(--success)]",
  Testing: "text-[color:var(--warning)]",
  Installed: "text-primary",
  Delivered: "text-muted-foreground",
  Faulty: "text-destructive",
};

const equipmentProgress: Record<string, number> = {
  Commissioned: 100,
  Testing: 75,
  Installed: 55,
  Delivered: 25,
  Faulty: 10,
};

function Dashboard() {
  const projects = useCrudStore(KEYS.projects, projectsSeed);
  const equipment = useCrudStore(KEYS.equipment, equipmentSeed);
  const inspections = useCrudStore(KEYS.inspections, inspectionsSeed);
  const commissioning = useCrudStore(KEYS.commissioning, commissioningSeed);

  const openIssues = inspections.filter(
    (i) => String(i.result) === "Failed" || String(i.result) === "Pending",
  ).length;

  const commissioningAvg =
    commissioning.length > 0
      ? Math.round(
          commissioning.reduce((sum, r) => sum + Number(r.pct ?? 0), 0) /
            commissioning.length,
        )
      : 0;

  const stats = [
    { label: "Projects", value: String(projects.length), sub: "Active Projects" },
    { label: "Equipment", value: String(equipment.length), sub: "Installed" },
    { label: "Open Issues", value: String(openIssues), sub: "Failed / Pending" },
    { label: "Commissioning", value: `${commissioningAvg}%`, sub: "Avg. Completed" },
  ];

  // Chart: top equipment items with a synthetic progress % by status
  const chartData = equipment.slice(0, 8).map((e) => ({
    name: String(e.tag ?? e.name ?? "").slice(0, 10),
    value: equipmentProgress[String(e.status)] ?? 0,
  }));

  return (
    <DashboardLayout title="Dashboard">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{s.value}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Equipment Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {tasks.map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" />
                  {t}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Equipment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[220px]">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.slice(0, 6).map((e, idx) => {
                const status = String(e.status ?? "");
                const progress = equipmentProgress[status] ?? 0;
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{String(e.name ?? e.tag ?? "")}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {String(e.location ?? "")}
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${equipmentTone[status] ?? ""}`}>
                        {status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={progress} className="h-2" />
                        <span className="w-10 text-right text-sm text-muted-foreground">
                          {progress}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
