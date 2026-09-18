import type { ContactKind, GapId, LeadOrigin, PipelineStage } from "./types";

export interface SeedLead {
  contactName: string;
  contactHandle: string;
  contactKind: ContactKind;
  origin: LeadOrigin;
  referredBy: string;
  stage: PipelineStage;
  city: string;
  currentPlan: string;
  lives: number | null;
  missing: GapId[];
  messages: { direction: "in" | "out"; authorLabel: string; body: string; minutesAgo: number }[];
}

export const HEALTH_LEADS: SeedLead[] = [
  {
    contactName: "Maria Souza",
    contactHandle: "++1-555-0017",
    contactKind: "pf",
    origin: "indicacao",
    referredBy: "Tia Regina (igreja)",
    stage: "qualificacao",
    city: "Nova Iguaçu",
    currentPlan: "Bradesco",
    lives: 4,
    missing: ["idades", "urgencia", "operadora"],
    messages: [
      {
        direction: "in",
        authorLabel: "Maria Souza",
        body: "Bom dia. Quero um plano para mim, meu marido e duas crianças (5 e 9). Tem Unimed Nacional?",
        minutesAgo: 42,
      },
      {
        direction: "out",
        authorLabel: "Você",
        body: "Bom dia, Maria. Consigo sim. Vocês estão em qual cidade, e já têm plano hoje?",
        minutesAgo: 38,
      },
      {
        direction: "in",
        authorLabel: "Maria Souza",
        body: "Nova Iguaçu. Estamos no Bradesco, mas a mensalidade subiu muito. Quero comparar Unimed e Amil.",
        minutesAgo: 12,
      },
    ],
  },
  {
    contactName: "Horizonte Clínica Ltda",
    contactHandle: "+55 21 3264-1190",
    contactKind: "pj",
    origin: "ligacao",
    referredBy: "",
    stage: "cotacao",
    city: "Nilópolis",
    currentPlan: "Hapvida",
    lives: 18,
    missing: ["urgencia"],
    messages: [
      {
        direction: "in",
        authorLabel: "Horizonte Clínica",
        body: "Somos 18 vidas, clínica em Nilópolis. Preciso de cotação empresarial Amil e SulAmérica, com obstetrícia.",
        minutesAgo: 95,
      },
      {
        direction: "out",
        authorLabel: "Você",
        body: "Perfeito. Me manda CNPJ, CEP da clínica e se já tem plano hoje? A Cátia monta o comparativo.",
        minutesAgo: 80,
      },
      {
        direction: "in",
        authorLabel: "Horizonte Clínica",
        body: "CNPJ 32.441.008/0001-77. CEP 26525-000. Hoje estamos na Hapvida. Queremos migrar.",
        minutesAgo: 22,
      },
    ],
  },
  {
    contactName: "João Pedro Alves",
    contactHandle: "+55 21 99701-2288",
    contactKind: "pf",
    origin: "whatsapp",
    referredBy: "",
    stage: "novo",
    city: "",
    currentPlan: "Bradesco",
    lives: 1,
    missing: ["cidade", "idades", "urgencia"],
    messages: [
      {
        direction: "in",
        authorLabel: "João Pedro Alves",
        body: "Quero portabilidade. Estou no Bradesco há 3 anos, sem carência cumprida a perder. Pode?",
        minutesAgo: 180,
      },
    ],
  },
  {
    contactName: "Fernanda Lima",
    contactHandle: "+55 21 98155-6730",
    contactKind: "pf",
    origin: "instagram",
    referredBy: "",
    stage: "novo",
    city: "",
    currentPlan: "",
    lives: null,
    missing: ["cidade", "vidas", "plano_atual", "urgencia"],
    messages: [
      {
        direction: "in",
        authorLabel: "Fernanda Lima",
        body: "Qual a carência pra parto? Estou de 8 semanas. Plano individual ou por MEI fica mais em conta?",
        minutesAgo: 8,
      },
    ],
  },
  {
    contactName: "Ricardo Mota",
    contactHandle: "+55 21 96412-0093",
    contactKind: "pj",
    origin: "indicacao",
    referredBy: "Ana · atendimento",
    stage: "qualificacao",
    city: "",
    currentPlan: "",
    lives: 1,
    missing: ["cidade", "plano_atual", "cnpj"],
    messages: [
      {
        direction: "in",
        authorLabel: "Ricardo Mota",
        body: "Sou MEI, faturamento uns 6 mil. Dá pra fazer empresarial ou é ficha PF mesmo?",
        minutesAgo: 240,
      },
      {
        direction: "out",
        authorLabel: "Ana",
        body: "MEI entra com a Carla, Ricardo. Empresarial de 1 vida quase nunca vale. Ela te explica o corte.",
        minutesAgo: 230,
      },
      {
        direction: "in",
        authorLabel: "Ricardo Mota",
        body: "Beleza. Pode chamar ela.",
        minutesAgo: 220,
      },
    ],
  },
];

export const LEAD_POOL: SeedLead[] = [
  {
    contactName: "Patrícia Nunes",
    contactHandle: "+55 21 98877-3102",
    contactKind: "pf",
    origin: "instagram",
    referredBy: "",
    stage: "novo",
    city: "Duque de Caxias",
    currentPlan: "",
    lives: null,
    missing: ["vidas", "idades", "plano_atual", "urgencia"],
    messages: [
      {
        direction: "in",
        authorLabel: "Patrícia Nunes",
        body: "Vi o anúncio. Quero plano só odontológico + hospitalar em Duque de Caxias. Pode cotar?",
        minutesAgo: 0,
      },
    ],
  },
  {
    contactName: "Atlas Contábil",
    contactHandle: "+55 21 3551-4422",
    contactKind: "pj",
    origin: "indicacao",
    referredBy: "Horizonte Clínica",
    stage: "novo",
    city: "Rio de Janeiro",
    currentPlan: "",
    lives: 9,
    missing: ["plano_atual", "cnpj", "urgencia"],
    messages: [
      {
        direction: "in",
        authorLabel: "Atlas Contábil",
        body: "Escritório com 9 vidas. Precisamos de reajuste menor que 18% e rede no Centro do Rio.",
        minutesAgo: 0,
      },
    ],
  },
  {
    contactName: "Caio Mendes",
    contactHandle: "+55 21 99220-1876",
    contactKind: "pf",
    origin: "whatsapp",
    referredBy: "",
    stage: "novo",
    city: "",
    currentPlan: "",
    lives: 2,
    missing: ["cidade", "idades", "plano_atual", "urgencia"],
    messages: [
      {
        direction: "in",
        authorLabel: "Caio Mendes",
        body: "Minha mãe tem 67 anos. Aceita recém-nascido? Digo, idoso. Tem carência de doença preexistente?",
        minutesAgo: 0,
      },
    ],
  },
  {
    contactName: "Lívia Rocha",
    contactHandle: "+55 21 98664-5510",
    contactKind: "pf",
    origin: "site",
    referredBy: "",
    stage: "novo",
    city: "",
    currentPlan: "",
    lives: 1,
    missing: ["cidade", "plano_atual", "urgencia"],
    messages: [
      {
        direction: "in",
        authorLabel: "Lívia Rocha",
        body: "Quero cancelar o atual e entrar no de vocês. Tem multa? E o reembolso de consulta particular?",
        minutesAgo: 0,
      },
    ],
  },
];
