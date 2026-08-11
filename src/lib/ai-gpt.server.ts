const OPENAI_URL = "https://api.openai.com/v1/responses";

export const GPT_MODEL = "gpt-4o-mini";

type GptOptions = {
  input: unknown;
  instructions?: string;
  jsonSchema?: { name: string; schema: Record<string, unknown> };
};

/**
 * Calls the OpenAI API directly (Responses API) using the project's own
 * OPENAI_API_KEY. Streams the response and returns the final text.
 */
export async function callGpt({ input, instructions, jsonSchema }: GptOptions): Promise<string> {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) throw new Error("AI is not configured (missing OPENAI_API_KEY).");

  const body: Record<string, unknown> = {
    model: GPT_MODEL,
    input,
    stream: true,
    store: false,
  };
  if (instructions) body["instructions"] = instructions;
  if (jsonSchema) {
    body["text"] = {
      format: {
        type: "json_schema",
        name: jsonSchema.name,
        strict: true,
        schema: jsonSchema.schema,
      },
    };
  }

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    if (res.status === 401) throw new Error("Invalid OpenAI API key.");
    if (res.status === 429)
      throw new Error(
        "OpenAI rate limit or quota reached — check your OpenAI billing and try again.",
      );
    throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 200)}`);
  }


  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let out = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
          out += evt.delta;
        } else if (evt.type === "response.completed" && !out && evt.response?.output_text) {
          out = evt.response.output_text;
        }
      } catch {
        // ignore malformed keep-alive chunks
      }
    }
  }

  return out;
}
