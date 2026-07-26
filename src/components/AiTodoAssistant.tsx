import { useState } from "react";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { suggestDailyTodos } from "@/lib/ai-todo.functions";
import { useCrudStore } from "@/lib/crud-store";
import {
  KEYS,
  equipmentSeed,
  inspectionsSeed,
  commissioningSeed,
} from "@/lib/dcems-data";

type Todo = { task: string; why: string; priority: string };

const tone: Record<string, string> = {
  High: "text-destructive border-destructive/40 bg-destructive/10",
  Medium: "text-[color:var(--warning)] border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10",
  Low: "text-[color:var(--success)] border-[color:var(--success)]/40 bg-[color:var(--success)]/10",
};

export function AiTodoAssistant() {
  const equipment = useCrudStore(KEYS.equipment, equipmentSeed);
  const inspections = useCrudStore(KEYS.inspections, inspectionsSeed);
  const commissioning = useCrudStore(KEYS.commissioning, commissioningSeed);

  const suggest = useServerFn(suggestDailyTodos);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await suggest({
        data: {
          equipment: equipment as never,
          inspections: inspections as never,
          commissioning: commissioning as never,
        },
      });
      setTodos(res.todos ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Daily Todo Assistant
        </CardTitle>
        <Button size="sm" onClick={run} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Thinking…
            </>
          ) : (
            "Suggest Today's Priorities"
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {!error && todos.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">
            Click "Suggest Today's Priorities" to let AI analyze current equipment,
            inspections, and commissioning progress and recommend what your team should
            tackle today.
          </p>
        )}
        {todos.length > 0 && (
          <ol className="space-y-3">
            {todos.map((t, i) => (
              <li
                key={i}
                className="rounded-md border border-border bg-card/40 p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">
                    {i + 1}. {t.task}
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      tone[t.priority] ?? "text-muted-foreground border-border"
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
                {t.why && (
                  <p className="mt-1 text-xs text-muted-foreground">{t.why}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
