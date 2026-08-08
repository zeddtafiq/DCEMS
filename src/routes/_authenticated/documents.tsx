import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Folder,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Documents — DCEMS" },
      { name: "description", content: "Upload, download and manage project documents and file folders." },
      { property: "og:title", content: "Documents — DCEMS" },
      { property: "og:description", content: "Upload, download and manage project documents and file folders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocumentsPage,
});

type Doc = {
  id: string;
  created_by: string;
  name: string;
  folder: string;
  tag: string;
  uploaded_by: string | null;
  date: string;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
};

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

const emptyForm = {
  name: "",
  folder: "Contracts",
  tag: "New",
  uploaded_by: "",
  date: new Date().toISOString().slice(0, 10),
};

function fmtSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function DocumentsPage() {
  const [rows, setRows] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Doc | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Doc[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (folderFilter ? r.folder === folderFilter : true))
      .filter((r) =>
        q ? [r.name, r.folder, r.tag, r.uploaded_by ?? "", r.file_name ?? ""].join(" ").toLowerCase().includes(q) : true,
      );
  }, [rows, query, folderFilter]);

  const folders = folderMeta.map((f) => ({ ...f, count: rows.filter((r) => r.folder === f.name).length }));

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm });
    setFile(null);
    setDialogOpen(true);
  }

  function openEdit(row: Doc) {
    setEditing(row);
    setForm({
      name: row.name,
      folder: row.folder,
      tag: row.tag,
      uploaded_by: row.uploaded_by ?? "",
      date: row.date,
    });
    setFile(null);
    setDialogOpen(true);
  }

  async function save() {
    if (!userId) {
      toast.error("Please sign in to modify documents.");
      return;
    }
    if (!form.name.trim() && !file) {
      toast.error("Give the document a name or choose a file.");
      return;
    }
    setSaving(true);
    try {
      let filePatch: Partial<Doc> = {};
      if (file) {
        const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        if (editing?.file_path) await supabase.storage.from("documents").remove([editing.file_path]);
        filePatch = { file_path: path, file_name: file.name, file_size: file.size };
      }

      const payload = {
        ...form,
        name: form.name.trim() || file?.name || "Untitled",
        uploaded_by: form.uploaded_by.trim() || null,
        ...filePatch,
      };

      if (editing) {
        const { error } = await supabase.from("documents").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Document updated");
      } else {
        const { error } = await supabase.from("documents").insert({ ...payload, created_by: userId });
        if (error) throw error;
        toast.success("Document uploaded");
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function download(row: Doc) {
    if (!row.file_path) return;
    setBusyId(row.id);
    const { data, error } = await supabase.storage.from("documents").download(row.file_path);
    setBusyId(null);
    if (error || !data) {
      toast.error(error?.message ?? "Download failed");
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = row.file_name ?? row.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function confirmDelete() {
    if (!deleting) return;
    const row = deleting;
    setDeleting(null);
    if (row.file_path) await supabase.storage.from("documents").remove([row.file_path]);
    const { error } = await supabase.from("documents").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else toast.success("Document deleted");
    await load();
  }

  return (
    <DashboardLayout title="Documents">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Folder className="h-5 w-5 text-primary" />
        <span>
          Total: {rows.length} files across {folderMeta.length} folders
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {folders.map((f) => (
          <Card
            key={f.name}
            onClick={() => setFolderFilter(folderFilter === f.name ? null : f.name)}
            className={`cursor-pointer transition hover:border-primary ${folderFilter === f.name ? "border-primary" : ""}`}
          >
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

      <Card className="mt-6">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{folderFilter ? `${folderFilter} Files` : "All Files"}</CardTitle>
          <div className="flex items-center gap-2">
            {folderFilter && (
              <Button variant="outline" onClick={() => setFolderFilter(null)}>
                Clear filter
              </Button>
            )}
            <Input
              placeholder="Search documents…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-48"
            />
            <Button onClick={openAdd}>
              <Plus className="mr-1 h-4 w-4" /> Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Folder</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Loading documents…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No documents yet. Use “Upload” to add your first file.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.folder}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.file_name ? (
                        <span className="flex items-center gap-2">
                          <span className="max-w-40 truncate">{r.file_name}</span>
                          <span className="text-xs">{fmtSize(r.file_size)}</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{r.uploaded_by ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={tagTone[r.tag]}>
                        {r.tag}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={!r.file_path || busyId === r.id}
                          onClick={() => void download(r)}
                          aria-label="Download document file"
                        >
                          {busyId === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)} aria-label="Edit document">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleting(r)} aria-label="Delete document">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Document" : "Upload Document"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Document file</Label>
              <input
                ref={fileInput}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  if (f && !form.name.trim()) setForm((prev) => ({ ...prev, name: f.name }));
                }}
              />
              <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                {file ? file.name : editing?.file_name ? `Replace: ${editing.file_name}` : "Choose file"}
              </Button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Folder</Label>
                <Select value={form.folder} onValueChange={(v) => setForm({ ...form, folder: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {folderMeta.map((f) => (
                      <SelectItem key={f.name} value={f.name}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Tag</Label>
                <Select value={form.tag} onValueChange={(v) => setForm({ ...form, tag: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(tagTone).map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="by">Uploaded By</Label>
                <Input
                  id="by"
                  value={form.uploaded_by}
                  onChange={(e) => setForm({ ...form, uploaded_by: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Upload document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>This removes the record and its uploaded file permanently.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
