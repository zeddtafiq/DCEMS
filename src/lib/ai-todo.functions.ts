import { createServerFn } from "@tanstack/react-start";

type Ctx = {
  equipment: Array<{ tag?: string; name?: string; status?: string; location?: string }>;
  inspections: Array<{ id?: string; equipment?: string; result?: string; type?: string }>;
  commissioning: Array<{ name?: string; pct?: number; stage?: string }>;
};

export const suggestDailyTodos = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as Ctx)
  .handler(async ({ data }) => {
    const { callGpt } = await import("./ai-gpt.server");

    const summary = {
      faultyOrTesting: (data.equipment ?? [])
        .filter((e) => ["Faulty", "Testing", "Installed"].includes(String(e.status)))
        .slice(0, 15),
      openInspections: (data.inspections ?? [])
        .filter((i) => ["Failed", "Pending"].includes(String(i.result)))
        .slice(0, 15),
      lowCommissioning: [...(data.commissioning ?? [])]
        .sort((a, b) => Number(a.pct ?? 0) - Number(b.pct ?? 0))
        .slice(0, 6),
    };

    const prompt = `You are a senior electrical commissioning site engineer.
Given the current site status (JSON below), decide the 5-7 highest-priority tasks the site team should do TODAY.
Prioritize safety issues, failed inspections, faulty equipment, and low-progress commissioning systems.

Site status:
${JSON.stringify(summary, null, 2)}`;

    const text = await callGpt({
      input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
      jsonSchema: {
        name: "daily_todos",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            todos: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  task: { type: "string" },
                  why: { type: "string" },
                  priority: { type: "string", enum: ["High", "Medium", "Low"] },
                },
                required: ["task", "why", "priority"],
              },
            },
          },
          required: ["todos"],
        },
      },
    });

    try {
      const parsed = JSON.parse(text || "{}");
      const todos = Array.isArray(parsed.todos) ? parsed.todos : [];
      return { todos } as { todos: Array<{ task: string; why: string; priority: string }> };
    } catch {
      return { todos: [] };
    }
  });
