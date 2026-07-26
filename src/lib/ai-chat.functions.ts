import { createServerFn } from "@tanstack/react-start";

type Msg = { role: "user" | "assistant" | "system"; content: string };

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as { messages: Msg[]; context?: unknown })
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const system: Msg = {
      role: "system",
      content: `You are the DCEMS AI Assistant — a helpful assistant for an electrical commissioning site team. You have access to the current site data (projects, equipment, inspections, testing, commissioning, materials, drawings). Answer concisely in markdown. When asked about status, cite counts from the provided context.

Site context (JSON):
${JSON.stringify(data.context ?? {}, null, 2)}`,
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [system, ...data.messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("AI rate limit — try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted — add credits in workspace billing.");
      throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    return { content };
  });
