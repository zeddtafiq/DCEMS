import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <DashboardLayout title={title}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{description}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            This section is ready to be built out. Let me know what fields, tables, or workflows
            you want here.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
