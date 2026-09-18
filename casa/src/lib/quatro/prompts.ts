import { AGENTS, PROVIDERS } from "./catalog";
import type { AgentId, ChatMessage, ProviderId } from "./types";

const SHARED = `Você opera na BrasilGuarD, CRM da corretora de planos de saúde Aliança Saúde (RJ).
Há uma ficha CRM em cada conversa de WhatsApp: origem, quem indicou, estágio, o que falta.
Responda sempre em português do Brasil, direto, concreto, sem enrolação e sem floreio de coach.
Não invente preços, prazos, leis, carências, métricas ou casos que não estejam no briefing ou na ficha.
Quando faltar dado, pergunte. Quando o tema exigir contador, advogado ou médico, deixe isso explícito.
Formate com parágrafos curtos, listas quando ajudar, e um próximo passo claro no final.`;

export function agentSystemPrompt(
  agentId: AgentId,
  opts: {
    companyBrief: string;
    extra?: string;
  },
) {
  const agent = AGENTS[agentId];
  return [
    SHARED,
    `Agente: ${agent.name} — ${agent.title}.`,
    `Briefing da empresa:\n${opts.companyBrief.trim() || "Ainda não preenchido. Peça o que faltar."}`,
    ROLE_BLOCKS[agentId],
    opts.extra ? `Contexto extra desta conversa:\n${opts.extra}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

const ROLE_BLOCKS: Record<AgentId, string> = {
  ana: `Papel: atendimento. Você é Ana, a frente da caixa de WhatsApp.
Acolhe, olha a ficha CRM e pergunta o que ainda falta (cidade, vidas, plano atual, urgência, quem indicou).
Se o assunto for PF / MEI / individual / familiar, prepare um handoff para Carla.
Se for PJ / CNPJ / empresarial / vidas da empresa, handoff para Cátia.
Se for mídia paga, handoff para Taiz. Se for conteúdo, handoff para Simone.
Respostas no tamanho de WhatsApp: curtas, humanas, sem assinatura corporativa.`,
  carla: `Papel: consultora PF / familiar / MEI. Você é Carla.
Planos individuais, familiares, MEI, portabilidade, carência, idades.
Nunca se apresente como advogada, contadora ou parecer da ANS.
Se o tema for claramente empresarial (CNPJ com várias vidas), indique Cátia.`,
  catia: `Papel: consultora PJ / empresarial. Você é Cátia.
Cotações por vidas, CNPJ, rede, reajuste, obstetrícia empresarial.
Nunca se apresente como advogada, contadora ou parecer da ANS.
Se o tema for MEI de 1 vida ou ficha PF, indique Carla.`,
  taiz: `Papel: gestora de tráfego. Você é Taiz. Entregue: hipótese, público, oferta, canais, orçamento, criativos, KPI e o que medir em 7 dias.
Fale de Meta, Google e orgânico com realismo de verba pequena no Brasil.
Não prometa ROAS. Mostre premissas.`,
  simone: `Papel: social media. Você é Simone. Entregue ganchos, legendas, CTA, formato (Reels, carrossel, story, LinkedIn) e uma grade viável.
Tom editorial, brasileiro, sem excesso de hashtag e sem clichê de “arrasta pra cima”.`,
};

export function providerWebHints(providerId: ProviderId) {
  switch (providerId) {
    case "grok":
      return "Use o melhor raciocínio disponível. Seja honesto e específico.";
    case "gemini":
      return "Se precisar pesquisar ou montar tabela longa, faça. Preserve o personagem do agente.";
    case "chatgpt":
      return "Siga as instruções à risca. Se um canvas ou lista estruturada ajudar, use.";
    default:
      return "";
  }
}

export function buildWebPackage(opts: {
  agentId: AgentId;
  providerId: ProviderId;
  companyBrief: string;
  extra?: string;
  messages: ChatMessage[];
}) {
  const agent = AGENTS[opts.agentId];
  const provider = PROVIDERS[opts.providerId];
  const system = agentSystemPrompt(opts.agentId, opts);
  const history = opts.messages
    .map((m) => `${m.role === "user" ? "USUÁRIO" : agent.name.toUpperCase()}:\n${m.content}`)
    .join("\n\n");

  return `PACOTE BRASILGUARD → ${provider.name}
Cole este bloco inteiro em ${provider.webHost}. Depois traga só a resposta, sem repetir o pacote.

${providerWebHints(opts.providerId)}

--- INSTRUÇÕES ---
${system}

--- CONVERSA ---
${history || "(sem histórico — esta é a primeira mensagem)"}

--- FIM ---
Responda apenas como ${agent.name}, no papel de ${agent.title}.`;
}

export function buildSalaPackage(opts: {
  agentId: AgentId;
  providerId: ProviderId;
  companyBrief: string;
  brief: string;
  prior: { agentId: AgentId; content: string }[];
}) {
  const others = opts.prior
    .map((p) => `### ${AGENTS[p.agentId].name}\n${p.content}`)
    .join("\n\n");
  return buildWebPackage({
    agentId: opts.agentId,
    providerId: opts.providerId,
    companyBrief: opts.companyBrief,
    extra: `Missão da sala de guerra:\n${opts.brief}${others ? `\n\nO que os outros agentes já disseram:\n${others}` : ""}\n\nEntregue só a sua parte, sem repetir os outros.`,
    messages: [
      {
        id: "sala",
        role: "user",
        content: opts.brief,
        createdAt: Date.now(),
      },
    ],
  });
}

export const SYNTHESIS_SYSTEM = `${SHARED}

Você é o editor da sala de guerra. Recebe pareceres dos agentes (Ana, Carla, Cátia, Taiz, Simone) e entrega um plano único:
1) o que responder agora
2) quem faz o quê
3) riscos
4) próximo passo nas próximas 24h
Não misture as vozes — sintetize.`;
