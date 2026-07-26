import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatWithAssistant } from "@/lib/ai-chat.functions";
import { useCrudStore } from "@/lib/crud-store";
import {
  KEYS,
  projectsSeed,
  equipmentSeed,
  materialsSeed,
  drawingsSeed,
  inspectionsSeed,
  testingSeed,
  commissioningSeed,
} from "@/lib/dcems-data";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How many projects are active?",
  "Which equipment is faulty?",
  "Summarize commissioning progress",
];

export function AiChat() {
  const chat = useServerFn(chatWithAssistant);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const projects = useCrudStore(KEYS.projects, projectsSeed);
  const equipment = useCrudStore(KEYS.equipment, equipmentSeed);
  const materials = useCrudStore(KEYS.materials, materialsSeed);
  const drawings = useCrudStore(KEYS.drawings, drawingsSeed);
  const inspections = useCrudStore(KEYS.inspections, inspectionsSeed);
  const testing = useCrudStore(KEYS.testing, testingSeed);
  const commissioning = useCrudStore(KEYS.commissioning, commissioningSeed);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await chat({
        data: {
          messages: next,
          context: {
            projects: projects.length,
            equipment: { total: equipment.length, sample: equipment.slice(0, 20) },
            materials: { total: materials.length, sample: materials.slice(0, 10) },
            drawings: { total: drawings.length, sample: drawings.slice(0, 10) },
            inspections: { total: inspections.length, sample: inspections.slice(0, 15) },
            testing: { total: testing.length, sample: testing.slice(0, 10) },
            commissioning,
          },
        },
      });
      setMessages([...next, { role: "assistant", content: res.content || "(no response)" }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setMessages(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Chat Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollRef}
          className="h-80 overflow-y-auto rounded-md border border-border bg-background/40 p-4 space-y-4"
        >
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              <Bot className="h-8 w-8 mx-auto mb-3 opacity-60" />
              <p className="mb-3">Ask me anything about your site data.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mt-3 flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about equipment, inspections, progress..."
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
