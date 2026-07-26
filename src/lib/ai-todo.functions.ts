import { createServerFn } from "@tanstack/react-start";

type Ctx = {
  equipment: Array<{ tag?: string; name?: string; status?: string; location?: string }>;
  inspections: Array<{ id?: string; equipment?: string; result?: string; type?: string }>;
  commissioning: Array<{ name?: string; pct?: number; stage?: string }>;
};

export const suggestDailyTodos = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as Ctx)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const summary = {
      faultyOrTesting: data.equipment
        .filter((e) => ["Faulty", "Testing", "Installed"].includes(String(e.status)))
        .slice(0, 15),
      openInspections: data.inspections
        .filter((i) => ["Failed", "Pending"].includes(String(i.result)))
        .slice(0, 15),
      lowCommissioning: [...data.commissioning]
        .sort((a, b) => Number(a.pct ?? 0) - Number(b.pct ?? 0))
        .slice(0, 6),
    };

    const prompt = `You are a senior electrical commissioning site engineer.
Given the current site status (JSON below), decide the 5–7 highest-priority tasks the site team should do TODAY.
Prioritize safety issues, failed inspections, faulty equipment, and low-progress commissioning systems.

Respond as a strict JSON object: { "todos": [{ "task": string, "why": string, "priority": "High"|"Medium"|"Low" }] }
Return ONLY JSON, no prose.

Site status:
${JSON.stringify(summary, null, 2)}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("AI rate limit — try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted — add credits in workspace billing.");
      throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(content);
      const todos = Array.isArray(parsed.todos) ? parsed.todos : [];
      return { todos } as { todos: Array<{ task: string; why: string; priority: string }> };
    } catch {
      return { todos: [] };
    }
  });
