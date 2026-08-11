import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Eye, FileText, GitBranch, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { createRow, deleteRow, downloadFile, listRows, onUidChange, removeFile, updateRow, uploadFile } from "@/lib/cloud-db";

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

export const Route = createFileRoute("/_authenticated/drawings")({
  head: () => ({
    meta: [
      { title: "Drawings — DCEMS" },
      { name: "description", content: "Upload, download and manage electrical drawings and revisions." },
      { property: "og:title", content: "Drawings — DCEMS" },
      { property: "og:description", content: "Upload, download and manage electrical drawings and revisions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DrawingsPage,
});

type Drawing = {
  id: string;
  created_by: string;
  no: string;
  title: string;
  rev: string;
  discipline: string;
  status: string;
  date: string;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
};

const STATUSES = ["IFC", "For Review", "Approved", "Superseded"];
const DISCIPLINES = ["Electrical", "ELV", "Mechanical", "Civil"];

const tone: Record<string, string> = {
  Approved: "bg-[color:var(--success)]/20 text-[color:var(--success)] border-[color:var(--success)]/30",
  "For Review": "bg-[color:var(--warning)]/20 text-[color:var(--warning)] border-[color:var(--warning)]/30",
  IFC: "bg-primary/20 text-primary border-primary/30",
  Superseded: "bg-muted text-muted-foreground border-border",
};

const emptyForm = {
  no: "",
  title: "",
  rev: "R1",
  discipline: "Electrical",
  status: "For Review",
  date: new Date().toISOString().slice(0, 10),
};

function fmtSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function DrawingsPage() {
  const [rows, setRows] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Drawing | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Drawing | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setRows(await listRows<Drawing>("drawings"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load drawings");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsub = onUidChange(setUserId);
    void load();
    return unsub;
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.no, r.title, r.rev, r.discipline, r.status, r.file_name ?? ""].join(" ").toLowerCase().includes(q),
    );
  }, [rows, query]);

  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const revs = Array.from(new Set(rows.map((r) => r.rev).filter(Boolean))).sort();
  const stats = [
    { label: "Total Drawings", value: String(rows.length), icon: FileText },
    { label: "Approved", value: String(count("Approved")), icon: FileText },
    { label: "For Review", value: String(count("For Review")), icon: Eye },
    { label: "Revisions", value: revs.length ? `${revs[0]}–${revs[revs.length - 1]}` : "—", icon: GitBranch },
  ];

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm });
    setFile(null);
    setDialogOpen(true);
  }

  function openEdit(row: Drawing) {
    setEditing(row);
    setForm({
      no: row.no,
      title: row.title,
      rev: row.rev,
      discipline: row.discipline,
      status: row.status,
      date: row.date,
    });
    setFile(null);
    setDialogOpen(true);
  }

  async function save() {
    if (!form.no.trim() || !form.title.trim()) {
      toast.error("Drawing number and title are required.");
      return;
    }
    const owner = userId ?? "public";
    setSaving(true);
    try {
      let filePatch: Partial<Drawing> = {};
      if (file) {
        const path = await uploadFile("drawings", owner, file);
        if (editing?.file_path) await removeFile(editing.file_path);
        filePatch = { file_path: path, file_name: file.name, file_size: file.size };
      }

      if (editing) {
        await updateRow("drawings", editing.id, { ...form, ...filePatch });
        toast.success("Drawing updated");
      } else {
        await createRow("drawings", {
          ...form,
          file_path: null,
          file_name: null,
          file_size: null,
          ...filePatch,
          created_by: userId ?? null,
        });
        toast.success("Drawing added");
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function download(row: Drawing) {
    if (!row.file_path) return;
    setBusyId(row.id);
    try {
      await downloadFile(row.file_path, row.file_name ?? "drawing");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const row = deleting;
    setDeleting(null);
    try {
      if (row.file_path) await removeFile(row.file_path);
      await deleteRow("drawings", row.id);
      toast.success("Drawing deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
    await load();
  }

  return (
    <DashboardLayout title="Drawings">
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

      <Card className="mt-6">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Drawing Register</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search drawings…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-48"
            />
            <Button onClick={openAdd}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drawing No.</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Rev</TableHead>
                <TableHead>Discipline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Loading drawings…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No drawings yet. Use “Add” to upload your first drawing.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.no}</TableCell>
                    <TableCell>{r.title}</TableCell>
                    <TableCell>{r.rev}</TableCell>
                    <TableCell className="text-muted-foreground">{r.discipline}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={tone[r.status]}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.date}</TableCell>
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={!r.file_path || busyId === r.id}
                          onClick={() => void download(r)}
                          aria-label="Download drawing file"
                        >
                          {busyId === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)} aria-label="Edit drawing">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleting(r)} aria-label="Delete drawing">
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
            <DialogTitle>{editing ? "Edit Drawing" : "Add Drawing"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="no">Drawing No.</Label>
              <Input id="no" value={form.no} onChange={(e) => setForm({ ...form, no: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rev">Rev</Label>
                <Input id="rev" value={form.rev} onChange={(e) => setForm({ ...form, rev: e.target.value })} />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Discipline</Label>
                <Select value={form.discipline} onValueChange={(v) => setForm({ ...form, discipline: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCIPLINES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Drawing file</Label>
              <input
                ref={fileInput}
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                {file ? file.name : editing?.file_name ? `Replace: ${editing.file_name}` : "Choose file"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Add drawing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete drawing?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the record and its uploaded file permanently.
            </AlertDialogDescription>
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
