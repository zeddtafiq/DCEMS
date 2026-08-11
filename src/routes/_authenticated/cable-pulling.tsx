import { createFileRoute } from "@tanstack/react-router";
import { Cable as CableIcon, Ruler, CircleDot, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTable } from "@/components/CrudTable";
import { useCrudStore } from "@/lib/crud-store";
import { KEYS, cablePullingSeed } from "@/lib/dcems-data";

export const Route = createFileRoute("/_authenticated/cable-pulling")({
  head: () => ({
    meta: [
      { title: "Cable Pulling — DCEMS" },
      { name: "description", content: "Track cable drums, pulled lengths, routes and installation status." },
      { property: "og:title", content: "Cable Pulling — DCEMS" },
      { property: "og:description", content: "Track cable drums, pulled lengths, routes and installation status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CablePullingPage,
});

const statusTone: Record<string, string> = {
  Pulled: "border-emerald-500/40 text-emerald-500",
  "In Progress": "border-amber-500/40 text-amber-500",
  Planned: "border-sky-500/40 text-sky-500",
  Terminated: "border-primary/40 text-primary",
};

function CablePullingPage() {
  const rows = useCrudStore(KEYS.cablePulling, cablePullingSeed);

  const totalPulled = rows.reduce((s, r) => s + Number(r.pulled ?? 0), 0);
  const drumStock = rows.reduce(
    (s, r) => s + Math.max(Number(r.drumLength ?? 0) - Number(r.pulled ?? 0), 0),
    0,
  );
  const done = rows.filter((r) => String(r.status) === "Pulled" || String(r.status) === "Terminated").length;

  const stats = [
    { label: "Cable Runs", value: String(rows.length), icon: CableIcon },
    { label: "Total Pulled (m)", value: totalPulled.toLocaleString("en-US"), icon: Ruler },
    { label: "Drum Remaining (m)", value: drumStock.toLocaleString("en-US"), icon: CircleDot },
    { label: "Completed Runs", value: String(done), icon: CheckCircle2 },
  ];

  const byType = rows.reduce<Record<string, number>>((acc, r) => {
    const type = String(r.cableType || "Unspecified").trim();
    acc[type] = (acc[type] || 0) + Number(r.pulled ?? 0);
    return acc;
  }, {});

  const typeCards = Object.entries(byType).sort(([a], [b]) => a.localeCompare(b));

  return (
    <DashboardLayout title="Cable Pulling">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Length by Cable Type</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {typeCards.map(([type, length]) => (
            <Card key={type} className="hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{type}</CardTitle>
                <CableIcon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{length.toLocaleString("en-US")} <span className="text-sm font-normal text-muted-foreground">m</span></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>


      <div className="mt-6">
        <CrudTable
          storageKey={KEYS.cablePulling}
          title="Cable Pulling Register"
          seed={cablePullingSeed}
          fields={[
            { key: "cableId", label: "Cable ID", mono: true },
            { key: "drumNo", label: "Drum No.", mono: true },
            { key: "cableType", label: "Cable Type" },
            {
              key: "size",
              label: "Size",
              type: "select",
              options: ["1C x 500mm²", "4C x 240mm²", "4C x 120mm²", "3C x 70mm²", "4C x 25mm²", "2C x 2.5mm²"],
            },
            { key: "from", label: "From" },
            { key: "to", label: "To" },
            { key: "route", label: "Route", type: "select", options: ["Cable Tray", "Trench", "Conduit", "Ladder", "Direct Buried"] },
            { key: "drumLength", label: "Drum Length (m)", type: "number" },
            { key: "pulled", label: "Pulled (m)", type: "number" },
            {
              key: "remaining",
              label: "Remaining (m)",
              muted: true,
              render: (_v, row) =>
                Math.max(Number(row.drumLength ?? 0) - Number(row.pulled ?? 0), 0).toLocaleString("en-US"),
            },
            { key: "crew", label: "Crew" },
            { key: "date", label: "Date", muted: true },
            {
              key: "status",
              label: "Status",
              type: "select",
              options: ["Planned", "In Progress", "Pulled", "Terminated"],
              tone: statusTone,
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
