import { useEffect, useMemo, useState } from "react";
import { notifyCrudChange } from "@/lib/crud-store";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CrudField = {
  key: string;
  label: string;
  type?: "text" | "number" | "select";
  options?: string[];
  required?: boolean;
  mono?: boolean;
  muted?: boolean;
  tone?: Record<string, string>;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
};

type Row = Record<string, unknown>;

export function CrudTable({
  storageKey,
  title,
  seed,
  fields,
  searchable = true,
}: {
  storageKey: string;
  title: string;
  seed: Row[];
  fields: CrudField[];
  searchable?: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(seed);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Row>({});
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setRows(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [storageKey]);

  // Persist
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(rows));
      notifyCrudChange(storageKey);
    } catch {
      /* ignore */
    }
  }, [rows, storageKey, ready]);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows.map((r, i) => ({ r, i }));
    const q = query.toLowerCase();
    return rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) =>
        fields.some((f) => String(r[f.key] ?? "").toLowerCase().includes(q)),
      );
  }, [rows, query, fields]);

  function openAdd() {
    const blank: Row = {};
    fields.forEach((f) => {
      blank[f.key] = f.type === "number" ? 0 : "";
    });
    setForm(blank);
    setEditingIndex(null);
    setDialogOpen(true);
  }

  function openEdit(index: number) {
    setForm({ ...rows[index] });
    setEditingIndex(index);
    setDialogOpen(true);
  }

  function save() {
    const record: Row = { ...form };
    fields.forEach((f) => {
      if (f.type === "number") record[f.key] = Number(record[f.key] ?? 0);
    });
    if (editingIndex === null) {
      setRows((prev) => [record, ...prev]);
    } else {
      setRows((prev) => prev.map((r, i) => (i === editingIndex ? record : r)));
    }
    setDialogOpen(false);
  }

  function confirmDelete() {
    if (deleteIndex === null) return;
    setRows((prev) => prev.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          {searchable && (
            <Input
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-xs"
            />
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingIndex === null ? "Add" : "Edit"} record
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                {fields.map((f) => (
                  <div key={f.key} className="grid gap-2">
                    <Label htmlFor={f.key}>{f.label}</Label>
                    {f.type === "select" && f.options ? (
                      <Select
                        value={String(form[f.key] ?? "")}
                        onValueChange={(v) =>
                          setForm((prev) => ({ ...prev, [f.key]: v }))
                        }
                      >
                        <SelectTrigger id={f.key}>
                          <SelectValue placeholder={`Select ${f.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {f.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={f.key}
                        type={f.type === "number" ? "number" : "text"}
                        value={String(form[f.key] ?? "")}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            [f.key]: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={save}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {fields.map((f) => (
                  <TableHead key={f.key}>{f.label}</TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={fields.length + 1}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No records. Click "Add" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(({ r, i }) => (
                  <TableRow key={i}>
                    {fields.map((f) => {
                      const v = r[f.key];
                      const text = String(v ?? "");
                      let cell: React.ReactNode = text;
                      if (f.render) cell = f.render(v, r);
                      else if (f.tone)
                        cell = (
                          <Badge
                            variant="outline"
                            className={f.tone[text] ?? ""}
                          >
                            {text}
                          </Badge>
                        );
                      const cls = [
                        f.mono ? "font-mono" : "",
                        f.muted ? "text-muted-foreground" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <TableCell key={f.key} className={cls || undefined}>
                          {cell}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(i)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteIndex(i)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <AlertDialog
          open={deleteIndex !== null}
          onOpenChange={(o) => !o && setDeleteIndex(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this record?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
