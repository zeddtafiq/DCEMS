import { createFileRoute } from "@tanstack/react-router";
import { Folder, FileText, Image as ImageIcon, FileSpreadsheet } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { CrudTable } from "@/components/CrudTable";
import { useCrudStore } from "@/lib/crud-store";
import { KEYS, documentsSeed } from "@/lib/dcems-data";

export const Route = createFileRoute("/documents")({
  head: () => ({ meta: [{ title: "Documents — DCEMS" }, { name: "description", content: "Project document library." }] }),
  component: DocumentsPage,
});

const folderMeta = [
  { name: "Contracts", icon: FileText },
  { name: "Method Statements", icon: FileText },
  { name: "ITP & QCP", icon: FileSpreadsheet },
  { name: "As-Built", icon: FileText },
  { name: "Photos", icon: ImageIcon },
  { name: "O&M Manuals", icon: FileText },
];

const tagTone: Record<string, string> = {
  Approved: "bg-[color:var(--success)]/20 text-[color:var(--success)] border-[color:var(--success)]/30",
  Final: "bg-[color:var(--success)]/20 text-[color:var(--success)] border-[color:var(--success)]/30",
  Live: "bg-primary/20 text-primary border-primary/30",
  New: "bg-primary/20 text-primary border-primary/30",
  Reference: "bg-muted text-muted-foreground border-border",
  Confidential: "bg-destructive/20 text-destructive border-destructive/30",
};

function DocumentsPage() {
  const rows = useCrudStore(KEYS.documents, documentsSeed);
  const folders = folderMeta.map((f) => ({
    ...f,
    count: rows.filter((r) => r.folder === f.name).length,
  }));

  return (
    <DashboardLayout title="Documents">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Folder className="h-5 w-5 text-primary" />
        <span>Total: {rows.length} files across {folderMeta.length} folders</span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {folders.map((f) => (
          <Card key={f.name} className="cursor-pointer transition hover:border-primary">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <f.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">{f.name}</p>
                <p className="text-sm text-muted-foreground">{f.count} files</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <CrudTable
          storageKey={KEYS.documents}
          title="Recent Files"
          seed={documentsSeed}
          fields={[
            { key: "name", label: "Name" },
            { key: "folder", label: "Folder", type: "select", options: folderMeta.map((f) => f.name), muted: true },
            { key: "size", label: "Size", muted: true },
            { key: "by", label: "Uploaded By" },
            { key: "date", label: "Date", muted: true },
            { key: "tag", label: "Tag", type: "select", options: Object.keys(tagTone), tone: tagTone },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
