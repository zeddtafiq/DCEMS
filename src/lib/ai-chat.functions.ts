import { createServerFn } from "@tanstack/react-start";

type Msg = { role: "user" | "assistant" | "system"; content: string };

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as { messages: Msg[]; context?: unknown })
  .handler(async ({ data }) => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("Missing OPENAI_API_KEY");

    const system: Msg = {
      role: "system",
      content: `You are the DCEMS AI Assistant — a helpful assistant for an electrical commissioning site team. You have access to the current site data (projects, equipment, inspections, testing, commissioning, materials, drawings). Answer concisely in markdown. When asked about status, cite counts from the provided context.

Site context (JSON):
${JSON.stringify(data.context ?? {}, null, 2)}`,
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [system, ...data.messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401) throw new Error("Invalid ChatGPT (OpenAI) API key.");
      if (res.status === 429) {
        throw new Error(
          text.includes("insufficient_quota") || text.includes("credit_balance")
            ? "Your ChatGPT (OpenAI) account has no credits left. Add credits in the OpenAI billing settings to use the assistant."
            : "ChatGPT rate limit reached — try again shortly.",
        );
      }
      throw new Error(`ChatGPT error ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    return { content };
  });
