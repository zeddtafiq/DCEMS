import { supabase } from "@/integrations/supabase/client";

/**
 * Data access for Lovable Cloud (database + storage).
 * Paths are stored as `${bucket}/${uid}/${filename}` so a single path
 * identifies both the bucket and the object.
 */

function splitPath(path: string): { bucket: string; key: string } {
  const i = path.indexOf("/");
  return { bucket: path.slice(0, i), key: path.slice(i + 1) };
}

export async function currentUid(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/** Subscribe to auth changes; returns an unsubscribe function. */
export function onUidChange(cb: (uid: string | null) => void) {
  void supabase.auth.getSession().then(({ data }) => cb(data.session?.user.id ?? null));
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session?.user.id ?? null));
  return () => data.subscription.unsubscribe();
}

/** Fetch every row of a table, newest first. */
export async function listRows<T>(name: "documents" | "drawings"): Promise<T[]> {
  const { data, error } = await supabase.from(name).select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export async function createRow(name: "documents" | "drawings", values: Record<string, unknown>) {
  const { error } = await supabase.from(name).insert(values as never);
  if (error) throw new Error(error.message);
}

export async function updateRow(name: "documents" | "drawings", id: string, values: Record<string, unknown>) {
  const { error } = await supabase.from(name).update(values as never).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteRow(name: "documents" | "drawings", id: string) {
  const { error } = await supabase.from(name).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Upload a file to a storage bucket and return its stored path. */
export async function uploadFile(bucket: string, uid: string, file: File) {
  const key = `${uid}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
  const { error } = await supabase.storage.from(bucket).upload(key, file, { upsert: false });
  if (error) throw new Error(error.message);
  return `${bucket}/${key}`;
}

export async function removeFile(path: string) {
  const { bucket, key } = splitPath(path);
  await supabase.storage.from(bucket).remove([key]);
}

/** Trigger a browser download for a stored file. */
export async function downloadFile(path: string, fileName: string) {
  const { bucket, key } = splitPath(path);
  const { data, error } = await supabase.storage.from(bucket).download(key);
  if (error) throw new Error(error.message);
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
