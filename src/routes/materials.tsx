import { createFileRoute } from "@tanstack/react-router";
import { Package, Truck, PackageCheck, PackageX } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CrudTable } from "@/components/CrudTable";
import { useCrudStore } from "@/lib/crud-store";
import { KEYS, materialsSeed } from "@/lib/dcems-data";

export const Route = createFileRoute("/materials")({
  head: () => ({ meta: [{ title: "Materials — DCEMS" }, { name: "description", content: "Materials inventory and delivery tracking." }] }),
  component: MaterialsPage,
});

function MaterialsPage() {
  const rows = useCrudStore(KEYS.materials, materialsSeed);
  const inTransit = rows.filter((r) => Number(r.delivered ?? 0) < Number(r.ordered ?? 0)).length;
  const received = rows.filter((r) => Number(r.delivered ?? 0) >= Number(r.ordered ?? 0) && Number(r.ordered ?? 0) > 0).length;
  const backorders = rows.filter((r) => Number(r.delivered ?? 0) === 0 && Number(r.ordered ?? 0) > 0).length;

  const stats = [
    { label: "Line Items", value: String(rows.length), icon: Package },
    { label: "In Transit", value: String(inTransit), icon: Truck },
    { label: "Received", value: String(received), icon: PackageCheck },
    { label: "Backorders", value: String(backorders), icon: PackageX },
  ];

  return (
    <DashboardLayout title="Materials">
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
          storageKey={KEYS.materials}
          title="Materials Ledger"
          seed={materialsSeed}
          fields={[
            { key: "code", label: "Code", mono: true },
            { key: "name", label: "Description" },
            { key: "unit", label: "Unit", type: "select", options: ["m", "pcs", "kg", "set", "lot"] },
            { key: "ordered", label: "Ordered", type: "number" },
            { key: "delivered", label: "Delivered", type: "number" },
            { key: "used", label: "Used", type: "number" },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
