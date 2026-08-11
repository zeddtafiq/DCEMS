import { createServerFn } from "@tanstack/react-start";

type Msg = { role: "user" | "assistant" | "system"; content: string };

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as { messages: Msg[]; context?: unknown })
  .handler(async ({ data }) => {
    const { callGpt } = await import("./ai-gpt.server");

    const instructions = `You are the DCEMS AI Assistant — a helpful assistant for an electrical commissioning site team. You have access to the current site data (projects, equipment, inspections, testing, commissioning, materials, drawings). Answer concisely in markdown. When asked about status, cite counts from the provided context.

Site context (JSON):
${JSON.stringify(data.context ?? {}, null, 2)}`;

    const input = (data.messages ?? []).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: [
        {
          type: m.role === "assistant" ? "output_text" : "input_text",
          text: m.content,
        },
      ],
    }));

    const content = await callGpt({ input, instructions });
    return { content };
  });
