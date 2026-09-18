import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(12000),
});

const InputSchema = z.object({
  provider: z.enum(["grok", "gemini", "chatgpt"]),
  apiKey: z.string().max(256).optional(),
  model: z.string().max(80).optional(),
  system: z.string().max(8000),
  messages: z.array(MessageSchema).max(24),
});

type CompleteOk = { ok: true; text: string; model: string };
type CompleteErr = { ok: false; error: string };
export type CompleteResult = CompleteOk | CompleteErr;

export const completeChat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<CompleteResult> => {
    const messages = [
      { role: "system" as const, content: data.system },
      ...data.messages.filter((m) => m.content.trim()),
    ];

    try {
      if (data.provider === "grok") return await completeGrok(messages, data.model);
      if (data.provider === "gemini") {
        const key = data.apiKey?.trim();
        if (!key) return { ok: false, error: "Cole a chave da API do Gemini ou mude para Ponte Web." };
        return await completeGemini(messages, key, data.model);
      }
      const key = data.apiKey?.trim();
      if (!key) return { ok: false, error: "Cole a chave da API da OpenAI ou mude para Ponte Web." };
      return await completeOpenAI(messages, key, data.model);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao falar com o modelo.";
      return { ok: false, error: message };
    }
  });

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function completeGrok(messages: Msg[], model?: string): Promise<CompleteResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "SuperGrok API indisponível neste ambiente. Acopla em Ponte Web.",
    };
  }
  const used = model?.trim() || "grok-4.5";
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: used,
      messages,
      temperature: 0.7,
      max_tokens: 1400,
    }),
  });
  if (!res.ok) {
    return { ok: false, error: grokHint(res.status) };
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) return { ok: false, error: "O Grok devolveu uma resposta vazia." };
  return { ok: true, text, model: used };
}

function grokHint(status: number) {
  if (status === 401 || status === 403) return "A chave do Grok foi recusada.";
  if (status === 429) return "Cota do Grok momentaneamente cheia. Tenta de novo em instantes.";
  return `Grok retornou erro ${status}.`;
}

async function completeOpenAI(messages: Msg[], apiKey: string, model?: string): Promise<CompleteResult> {
  const used = model?.trim() || "gpt-4o";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: used,
      messages,
      temperature: 0.7,
      max_tokens: 1400,
    }),
  });
  if (!res.ok) {
    if (res.status === 401) return { ok: false, error: "Chave da OpenAI inválida." };
    return { ok: false, error: `OpenAI retornou erro ${res.status}.` };
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) return { ok: false, error: "O ChatGPT devolveu uma resposta vazia." };
  return { ok: true, text, model: used };
}

async function completeGemini(messages: Msg[], apiKey: string, model?: string): Promise<CompleteResult> {
  const used = model?.trim() || "gemini-2.0-flash";
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const rest = messages.filter((m) => m.role !== "system");
  const contents = rest.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${used}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 1400 },
    }),
  });
  if (!res.ok) {
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      return { ok: false, error: "Chave ou modelo do Gemini recusados." };
    }
    return { ok: false, error: `Gemini retornou erro ${res.status}.` };
  }
  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    body.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? "";
  if (!text) return { ok: false, error: "O Gemini devolveu uma resposta vazia." };
  return { ok: true, text, model: used };
}
