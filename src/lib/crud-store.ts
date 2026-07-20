import { useEffect, useState } from "react";

const EVT = "dcems:store";

type Row = Record<string, unknown>;

function read<T extends Row>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T[];
  } catch {
    /* ignore */
  }
  return seed;
}

export function notifyCrudChange(key: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVT, { detail: { key } }));
}

/**
 * Read-only live view of a CrudTable's localStorage store.
 * Re-renders when the same tab or another tab updates the key.
 */
export function useCrudStore<T extends Row>(key: string, seed: T[]): T[] {
  const [rows, setRows] = useState<T[]>(seed);

  useEffect(() => {
    setRows(read(key, seed));
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setRows(read(key, seed));
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (detail?.key === key) setRows(read(key, seed));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVT, onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVT, onCustom as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return rows;
}
