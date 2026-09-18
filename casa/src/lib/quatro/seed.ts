import type {
  Campaign,
  ChatMessage,
  SocialPost,
  Thread,
  Ticket,
} from "./types";

const t = (iso: string) => new Date(iso).getTime();

function msg(
  id: string,
  role: ChatMessage["role"],
  content: string,
  createdAt: string,
): ChatMessage {
  return { id, role, content, createdAt: t(createdAt) };
}

export const DEFAULT_BRIEF = `BrasilGuarD — CRM de WhatsApp da corretora de planos de saúde Aliança Saúde (RJ).
Cinco agentes: Ana no atendimento, Carla no consultor PF, Cátia no consultor PJ, Taiz no tráfego e Simone no social.
A ficha do lead guarda origem, indicação, estágio e o que falta. Não inventar mensalidade, carência ou rede.
Tom: brasileiro, direto, elegante. Sem gurice.`;

export const seedThreads: Thread[] = [
  {
    id: "th-luna",
    agentId: "ana",
    title: "Luna · estúdio de estética",
    source: "ticket",
    updatedAt: t("2026-09-17T18:40:00-03:00"),
    messages: [
      msg(
        "m1",
        "user",
        "Oi, vi o Instagram. Vocês fazem gestão de conteúdo pra clínica de estética em Nova Iguaçu?",
        "2026-09-17T18:32:00-03:00",
      ),
      msg(
        "m2",
        "assistant",
        "Oi, Luna. Fazemos sim — social com a Simone e atendimento comigo. Tráfego com a Taiz se fizer sentido.\n\nPra eu te responder com precisão: você já publica sozinha ou está parada? E o que dói mais agora, agenda vazia ou visual fora do tom?",
        "2026-09-17T18:33:00-03:00",
      ),
      msg(
        "m3",
        "user",
        "Tô postando no improviso. Agenda oscila. Queria algo constante sem parecer propaganda barata.",
        "2026-09-17T18:38:00-03:00",
      ),
    ],
  },
  {
    id: "th-mei",
    agentId: "carla",
    title: "MEI ou LTDA agora?",
    source: "chat",
    updatedAt: t("2026-09-16T11:10:00-03:00"),
    messages: [
      msg(
        "n1",
        "user",
        "Tô validando o MVP ainda. Preciso abrir CNPJ já ou posso continuar PF?",
        "2026-09-16T11:04:00-03:00",
      ),
      msg(
        "n2",
        "assistant",
        "Se ainda não tem cliente recorrente pedindo nota, PF aguenta a validação. O gatilho pra CNPJ é outro: contrato com PJ, anúncio pago em nome da marca, ou faturamento que já assusta o limite do MEI.\n\nChecklist curto: 1) tem alguém pedindo NF? 2) pretende rodar ads no CNPJ? 3) sócio? Se as três forem não, espere o primeiro faturamento real e abra MEI no mesmo mês.",
        "2026-09-16T11:08:00-03:00",
      ),
    ],
  },
  {
    id: "th-pj",
    agentId: "catia",
    title: "Contrato e nota",
    source: "chat",
    updatedAt: t("2026-09-16T15:20:00-03:00"),
    messages: [
      msg(
        "c1",
        "user",
        "Um cliente PJ pediu contrato e nota. O que eu preciso ter pronto?",
        "2026-09-16T15:14:00-03:00",
      ),
      msg(
        "c2",
        "assistant",
        "Três peças: CNPJ ativo, um contrato curto de prestação e o contador habilitado a emitir NFS-e. Eu monto o esqueleto do contrato; o que é fiscal fica com o contador.\n\nMe diz: já tem CNPJ ou ainda está no MEI? E o cliente pediu nota avulsa ou contrato recorrente?",
        "2026-09-16T15:18:00-03:00",
      ),
    ],
  },
];

export const seedTickets: Ticket[] = [
  {
    id: "tk-luna",
    name: "Luna Alves",
    channel: "instagram",
    preview: "Gestão de conteúdo pra estética em Nova Iguaçu",
    status: "em_atendimento",
    threadId: "th-luna",
    createdAt: t("2026-09-17T18:32:00-03:00"),
  },
  {
    id: "tk-rafa",
    name: "Rafael Costa",
    channel: "whatsapp",
    preview: "Precisa emitir nota e passar a atender como PJ",
    status: "aberto",
    threadId: "th-rafa",
    createdAt: t("2026-09-18T08:12:00-03:00"),
  },
  {
    id: "tk-mari",
    name: "Mariana Pires",
    channel: "email",
    preview: "Reclamou do prazo do carrossel da semana passada",
    status: "aberto",
    threadId: "th-mari",
    createdAt: t("2026-09-18T07:40:00-03:00"),
  },
  {
    id: "tk-theo",
    name: "Theo Martins",
    channel: "site",
    preview: "Lead: tráfego para imobiliária, orçamento ~3 mil",
    status: "aberto",
    threadId: "th-theo",
    createdAt: t("2026-09-17T21:05:00-03:00"),
  },
];

export const extraThreads: Thread[] = [
  {
    id: "th-rafa",
    agentId: "ana",
    title: "Rafael · PJ",
    source: "ticket",
    updatedAt: t("2026-09-18T08:12:00-03:00"),
    messages: [
      msg(
        "r1",
        "user",
        "Boa tarde. Quero emitir nota e trabalhar como PJ com vocês. Como faz?",
        "2026-09-18T08:12:00-03:00",
      ),
    ],
  },
  {
    id: "th-mari",
    agentId: "ana",
    title: "Mariana · prazo",
    source: "ticket",
    updatedAt: t("2026-09-18T07:40:00-03:00"),
    messages: [
      msg(
        "ma1",
        "user",
        "Oi, o carrossel que era pra segunda ainda não chegou. Cliente reclamou.",
        "2026-09-18T07:40:00-03:00",
      ),
    ],
  },
  {
    id: "th-theo",
    agentId: "ana",
    title: "Theo · imobiliária",
    source: "ticket",
    updatedAt: t("2026-09-17T21:05:00-03:00"),
    messages: [
      msg(
        "te1",
        "user",
        "Vim pelo site. Tenho imobiliária em Nilópolis, uns 3 mil de verba. Vocês fazem tráfego?",
        "2026-09-17T21:05:00-03:00",
      ),
    ],
  },
];

export const seedCampaigns: Campaign[] = [
  {
    id: "cp-luna",
    name: "Luna · conversa no direct",
    platform: "meta",
    objective: "Mensagens · estética Nova Iguaçu",
    status: "rascunho",
    brief:
      "Oferta: avaliação gratuita de 20 min. Verba R$ 40/dia, 7 dias. Público mulheres 25–45, 15 km.",
    output: "",
    threadId: "th-cp-luna",
  },
  {
    id: "cp-imob",
    name: "Theo · captação de leads",
    platform: "google",
    objective: "Leads de locação e venda",
    status: "rascunho",
    brief:
      "Imobiliária em Nilópolis. Verba ~R$ 3.000/mês. Quer formulário no site, não só WhatsApp.",
    output: "",
    threadId: "th-cp-imob",
  },
];

function weekDates() {
  const start = new Date("2026-09-15T12:00:00-03:00");
  return [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const days = weekDates();

export const seedPosts: SocialPost[] = [
  {
    id: "sp-1",
    date: days[1],
    channel: "reels",
    title: "Antes / depois honesto",
    caption: "",
    status: "ideia",
    threadId: "th-sp-1",
  },
  {
    id: "sp-2",
    date: days[2],
    channel: "instagram",
    title: "O que não fazemos em tráfego",
    caption: "",
    status: "ideia",
    threadId: "th-sp-2",
  },
  {
    id: "sp-3",
    date: days[3],
    channel: "stories",
    title: "Bastidor do atendimento",
    caption: "",
    status: "ideia",
    threadId: "th-sp-3",
  },
  {
    id: "sp-4",
    date: days[4],
    channel: "linkedin",
    title: "PF, PJ e o momento de abrir CNPJ",
    caption: "",
    status: "ideia",
    threadId: "th-sp-4",
  },
  {
    id: "sp-5",
    date: days[5],
    channel: "reels",
    title: "Três perguntas que um lead bom responde",
    caption: "",
    status: "ideia",
    threadId: "th-sp-5",
  },
];

export function allSeedThreads(): Thread[] {
  const posts = seedPosts.map((p) => ({
    id: p.threadId,
    agentId: "simone" as const,
    title: p.title,
    messages: [] as ChatMessage[],
    updatedAt: Date.now(),
    source: "post" as const,
  }));
  const campaigns = seedCampaigns.map((c) => ({
    id: c.threadId,
    agentId: "taiz" as const,
    title: c.name,
    messages: [] as ChatMessage[],
    updatedAt: Date.now(),
    source: "campaign" as const,
  }));
  return [...seedThreads, ...extraThreads, ...posts, ...campaigns];
}
