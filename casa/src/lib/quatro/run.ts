import { completeChat } from "@/lib/ai/complete";
import { AGENTS, PROVIDERS } from "./catalog";
import { agentSystemPrompt, buildWebPackage } from "./prompts";
import { useQuatroStore } from "./store";
import type { AgentId } from "./types";

export async function runAgentTurn(opts: {
  agentId: AgentId;
  threadId: string;
  userText?: string;
  extra?: string;
  silentUser?: boolean;
}): Promise<{ mode: "api" | "web" | "blocked"; error?: string }> {
  const store = useQuatroStore.getState();
  const providerId = store.bindings[opts.agentId];
  const provider = store.providers[providerId];

  if (!provider?.coupled) {
    return { mode: "blocked", error: "Nenhuma IA acoplada neste agente. Abra Acoplamento." };
  }

  if (opts.userText && !opts.silentUser) {
    store.appendMessage(opts.threadId, { role: "user", content: opts.userText });
  }

  const thread = useQuatroStore.getState().threads.find((th) => th.id === opts.threadId);
  const messages = thread?.messages ?? [];
  const system = agentSystemPrompt(opts.agentId, {
    companyBrief: store.companyBrief,
    extra: opts.extra,
  });

  if (provider.mode === "web") {
    const packageText = buildWebPackage({
      agentId: opts.agentId,
      providerId,
      companyBrief: store.companyBrief,
      extra: opts.extra,
      messages,
    });
    store.setPendingBridge({
      threadId: opts.threadId,
      agentId: opts.agentId,
      providerId,
      packageText,
    });
    return { mode: "web" };
  }

  const history = messages.slice(-12).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const result = await completeChat({
    data: {
      provider: providerId,
      apiKey: provider.apiKey || undefined,
      model: provider.model,
      system,
      messages: history,
    },
  });

  if (!result.ok) {
    return { mode: "api", error: result.error };
  }

  store.appendMessage(opts.threadId, {
    role: "assistant",
    content: result.text,
    providerId,
    mode: "api",
  });
  return { mode: "api" };
}

export function agentLabel(agentId: AgentId) {
  const a = AGENTS[agentId];
  return `${a.name} · ${a.role}`;
}

export function providerLabel(id: keyof typeof PROVIDERS) {
  return PROVIDERS[id].short;
}
