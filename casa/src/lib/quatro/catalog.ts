import type { AgentId, ProviderId } from "./types";

export const AGENTS: Record<
  AgentId,
  {
    id: AgentId;
    name: string;
    role: string;
    title: string;
    blurb: string;
    color: string;
    defaultProvider: ProviderId;
  }
> = {
  ana: {
    id: "ana",
    name: "Ana",
    role: "Atendimento",
    title: "Atendente",
    blurb: "Responde leads, qualifica e transfere sem perder o tom humano.",
    color: "var(--color-klein)",
    defaultProvider: "grok",
  },
  carla: {
    id: "carla",
    name: "Carla",
    role: "Consultor PF",
    title: "Consultora PF / MEI",
    blurb: "Estrutura MEI, PF e o momento de abrir CNPJ — sem juridiquês vazio.",
    color: "var(--color-header)",
    defaultProvider: "chatgpt",
  },
  catia: {
    id: "catia",
    name: "Cátia",
    role: "Consultor PJ",
    title: "Consultora PJ",
    blurb: "Contrato, nota, sócios e operação de PJ — com o que é do contador bem marcado.",
    color: "var(--color-primary)",
    defaultProvider: "chatgpt",
  },
  taiz: {
    id: "taiz",
    name: "Taiz",
    role: "Tráfego",
    title: "Gestora de tráfego",
    blurb: "Campanhas, verba, criativos e diagnóstico de mídia paga.",
    color: "var(--color-vera)",
    defaultProvider: "gemini",
  },
  simone: {
    id: "simone",
    name: "Simone",
    role: "Social media",
    title: "Social media",
    blurb: "Grade, ganchos, legendas e ritmo de publicação.",
    color: "var(--color-sol)",
    defaultProvider: "grok",
  },
};

export const AGENT_ORDER: AgentId[] = ["ana", "carla", "catia", "taiz", "simone"];

export const PROVIDERS: Record<
  ProviderId,
  {
    id: ProviderId;
    name: string;
    short: string;
    plan: string;
    webUrl: string;
    webHost: string;
    defaultMode: "api" | "web";
    needsUserKey: boolean;
    defaultModel: string;
    extract: string[];
  }
> = {
  grok: {
    id: "grok",
    name: "SuperGrok",
    short: "Grok",
    plan: "Assinatura SuperGrok",
    webUrl: "https://grok.com",
    webHost: "grok.com",
    defaultMode: "api",
    needsUserKey: false,
    defaultModel: "grok-4.5",
    extract: [
      "Raciocínio direto e pouco corporativo",
      "Bom para atendimento e copy sem clichê",
      "API pronta neste hub — sem cola de chave",
    ],
  },
  gemini: {
    id: "gemini",
    name: "Gemini Pro",
    short: "Gemini",
    plan: "Plano Google AI Pro",
    webUrl: "https://gemini.google.com/app",
    webHost: "gemini.google.com",
    defaultMode: "web",
    needsUserKey: true,
    defaultModel: "gemini-2.0-flash",
    extract: [
      "Contexto longo e pesquisa profunda na web",
      "Forte em planejamento de mídia e tabelas",
      "Ponte Web agora; chave de API quando faturar",
    ],
  },
  chatgpt: {
    id: "chatgpt",
    name: "ChatGPT Plus",
    short: "ChatGPT",
    plan: "ChatGPT Plus",
    webUrl: "https://chatgpt.com",
    webHost: "chatgpt.com",
    defaultMode: "web",
    needsUserKey: true,
    defaultModel: "gpt-4o",
    extract: [
      "Instrução rígida e consultoria estruturada",
      "Canvas, GPTs e memória ficam na aba oficial",
      "Ponte Web agora; chave da Platform depois",
    ],
  },
};

export const PROVIDER_ORDER: ProviderId[] = ["grok", "gemini", "chatgpt"];

export const CARLA_TOPICS = [
  { id: "mei", label: "Abrir MEI", prompt: "Quero entender se MEI cabe no meu caso. Me faça as perguntas certas e depois um checklist." },
  { id: "pf", label: "Continuar PF", prompt: "Ainda estou validando o MVP. Posso continuar PF? Quais os gatilhos para abrir CNPJ?" },
  { id: "preco", label: "Precificação", prompt: "Me ajuda a precificar serviço de agência no Brasil, com piso, teto e o que entra na proposta." },
  { id: "imposto-pf", label: "Impostos PF", prompt: "Explica carnê-leão, DAS do MEI e o que eu preciso perguntar ao contador este mês como PF." },
];

export const CATIA_TOPICS = [
  { id: "ltda", label: "MEI vs LTDA", prompt: "Compara MEI, Simples LTDA e quando vale migrar. Linguagem de dono de negócio, não de cartilha." },
  { id: "contrato", label: "Contrato simples", prompt: "Quero um esqueleto de contrato de prestação de serviço para cliente PJ, com cláusulas essenciais e o que eu não posso inventar." },
  { id: "nota", label: "Nota fiscal", prompt: "Cliente pediu nota. O que eu preciso ter no CNPJ, o que perguntar ao contador, e o que eu não prometo." },
  { id: "imposto-pj", label: "Impostos PJ", prompt: "Explica DAS, pró-labore, sócios e o que eu preciso perguntar ao contador este mês como PJ." },
];

export const SALA_PRESETS = [
  {
    id: "reclamacao",
    label: "Reclamação no Instagram",
    brief:
      "Um cliente comentou no Instagram que o prazo estourou. Quero resposta pública, mensagem privada, e se vale oferecer algo. Tom firme e humano.",
  },
  {
    id: "lancamento",
    label: "Lançamento com R$ 80/dia",
    brief:
      "Vou lançar uma oferta de consultoria de 90 minutos por R$ 197. Orçamento R$ 80/dia no Meta, 10 dias. Público: donos de negócio no RJ e SP.",
  },
  {
    id: "pj",
    label: "Cliente quer PJ",
    brief:
      "Lead chegou pelo WhatsApp pedindo para emitir nota e 'passar a trabalhar como PJ'. Preciso atender, orientar o enquadramento e não prometer o que é do contador.",
  },
  {
    id: "grade",
    label: "Grade da semana",
    brief:
      "Montar a grade da próxima semana para o Instagram de um estúdio de estética em Nova Iguaçu. 4 posts + 3 stories. Sem linguagem de guru.",
  },
];
