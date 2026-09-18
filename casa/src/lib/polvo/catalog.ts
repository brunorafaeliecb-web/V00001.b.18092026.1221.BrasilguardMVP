import type {
  AgentHandoff,
  ChannelId,
  Conversation,
  ConversationStatus,
  GapId,
  LeadOrigin,
  PipelineStage,
  Role,
} from "./types";

export const ROLE_LABEL: Record<Role, string> = {
  operator: "Operador",
  supervisor: "Supervisor",
  admin: "Administrador",
};

export const ROLE_BLURB: Record<Role, string> = {
  operator: "Vendedor. Atende a caixa, preenche a ficha, pede a Ana.",
  supervisor: "Olha o time. Cadastra, edita e desativa operadores.",
  admin: "Faz o que o supervisor não faz: casa, canais e acoplamento.",
};

export const CHANNELS: Record<
  ChannelId,
  { id: ChannelId; name: string; short: string; live: boolean; blurb: string }
> = {
  whatsapp: {
    id: "whatsapp",
    name: "WhatsApp",
    short: "WA",
    live: true,
    blurb: "A caixa do corretor. Ficha, conversa e agente no mesmo lugar.",
  },
  telegram: {
    id: "telegram",
    name: "Telegram",
    short: "TG",
    live: false,
    blurb: "Mesma ficha, outro fio. Entra quando o canal for acoplado.",
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    short: "IG",
    live: false,
    blurb: "Comentários e menções da vitrine — sem misturar com o Direct.",
  },
  messenger: {
    id: "messenger",
    name: "Messenger",
    short: "FB",
    live: false,
    blurb: "Facebook Messenger na mesma fila de atendimento.",
  },
  direct: {
    id: "direct",
    name: "Direct",
    short: "DM",
    live: false,
    blurb: "Direct do Instagram. Conversa privada, mesma ficha.",
  },
};

export const CHANNEL_ORDER: ChannelId[] = [
  "whatsapp",
  "telegram",
  "instagram",
  "messenger",
  "direct",
];

export const STATUS_LABEL: Record<ConversationStatus, string> = {
  aberto: "Aberto",
  em_atendimento: "Em atendimento",
  aguardando: "Aguardando",
  handoff: "Com o agente",
  resolvido: "Resolvido",
};

export const AGENT_HANDOFF_LABEL: Record<AgentHandoff, string> = {
  ana: "Ana",
  carla: "Carla",
  catia: "Cátia",
  taiz: "Taiz",
  simone: "Simone",
};

export const ORIGIN_ORDER: LeadOrigin[] = [
  "whatsapp",
  "indicacao",
  "instagram",
  "facebook",
  "telegram",
  "site",
  "ligacao",
  "evento",
];

export const ORIGIN_LABEL: Record<LeadOrigin, string> = {
  whatsapp: "WhatsApp",
  indicacao: "Indicação",
  instagram: "Instagram",
  facebook: "Facebook",
  telegram: "Telegram",
  site: "Site",
  ligacao: "Ligação",
  evento: "Evento",
};

export const STAGE_ORDER: PipelineStage[] = [
  "novo",
  "qualificacao",
  "cotacao",
  "proposta",
  "fechamento",
  "ganho",
  "perdido",
];

export const STAGE_LABEL: Record<PipelineStage, string> = {
  novo: "Novo",
  qualificacao: "Qualificação",
  cotacao: "Cotação",
  proposta: "Proposta",
  fechamento: "Fechamento",
  ganho: "Ganho",
  perdido: "Perdido",
};

export const GAP_ORDER: GapId[] = [
  "cidade",
  "vidas",
  "idades",
  "plano_atual",
  "operadora",
  "urgencia",
  "cnpj",
  "indicacao",
];

export const GAP_LABEL: Record<GapId, string> = {
  cidade: "Cidade",
  vidas: "Quantas vidas",
  idades: "Idades",
  plano_atual: "Plano atual",
  operadora: "Operadora desejada",
  urgencia: "Urgência",
  cnpj: "CNPJ",
  indicacao: "Quem indicou",
};

export const TENTACLES = [
  {
    id: "brasilguard",
    name: "BrasilGuarD",
    kicker: "Ao vivo",
    live: true,
    blurb: "CRM de WhatsApp para a corretora: ficha, conversa e cinco agentes.",
    href: "/brasilguard",
  },
  {
    id: "seguranca",
    name: "Segurança eletrônica",
    kicker: "Depois",
    live: false,
    blurb: "CRM, ERP, alarme e câmera — quando o MVP vender.",
    href: "/tentaculos",
  },
] as const;

export function canManageTeam(role: Role) {
  return role === "supervisor" || role === "admin";
}

export function canAdmin(role: Role) {
  return role === "admin";
}

export function canAssignRole(actor: Role, target: Role) {
  if (actor === "admin") return true;
  if (actor === "supervisor") return target === "operator";
  return false;
}

const ORIGIN_SET = new Set<string>(ORIGIN_ORDER);
const STAGE_SET = new Set<string>(STAGE_ORDER);
const GAP_SET = new Set<string>(GAP_ORDER);

export function parseOrigin(value: unknown): LeadOrigin {
  const v = String(value ?? "");
  return ORIGIN_SET.has(v) ? (v as LeadOrigin) : "whatsapp";
}

export function parseStage(value: unknown): PipelineStage {
  const v = String(value ?? "");
  return STAGE_SET.has(v) ? (v as PipelineStage) : "novo";
}

export function parseGaps(value: unknown): GapId[] {
  let raw: unknown = value;
  if (typeof value === "string") {
    try {
      raw = JSON.parse(value);
    } catch {
      raw = [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is GapId => typeof item === "string" && GAP_SET.has(item));
}

export function inferGaps(input: {
  city?: string;
  lives?: number | null;
  currentPlan?: string;
  origin?: LeadOrigin;
  referredBy?: string;
  contactKind?: Conversation["contactKind"];
}): GapId[] {
  const missing: GapId[] = [];
  if (!input.city?.trim()) missing.push("cidade");
  if (input.lives == null) missing.push("vidas");
  if (!input.currentPlan?.trim()) missing.push("plano_atual");
  if (input.origin === "indicacao" && !input.referredBy?.trim()) missing.push("indicacao");
  if (input.contactKind === "pj") missing.push("cnpj");
  return missing;
}

export function formatFicha(c: Conversation) {
  const gaps = c.missing.length
    ? c.missing.map((g) => GAP_LABEL[g]).join(", ")
    : "nada crítico";
  return [
    `Nome: ${c.contactName}`,
    `Telefone: ${c.contactHandle}`,
    `Tipo: ${c.contactKind.toUpperCase()}`,
    `Origem: ${ORIGIN_LABEL[c.origin]}`,
    `Quem indicou: ${c.referredBy.trim() || "—"}`,
    `Estágio: ${STAGE_LABEL[c.stage]}`,
    `Cidade: ${c.city.trim() || "—"}`,
    `Vidas: ${c.lives ?? "—"}`,
    `Plano atual: ${c.currentPlan.trim() || "—"}`,
    `Falta na conversa: ${gaps}`,
  ].join("\n");
}
