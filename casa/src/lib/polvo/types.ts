export type Role = "operator" | "supervisor" | "admin";
export type MemberStatus = "active" | "inactive";
export type ChannelId = "whatsapp" | "telegram" | "instagram" | "messenger" | "direct";
export type ContactKind = "pf" | "pj";
export type ConversationStatus =
  | "aberto"
  | "em_atendimento"
  | "aguardando"
  | "handoff"
  | "resolvido";
export type MessageDirection = "in" | "out" | "note";
export type AgentHandoff = "ana" | "carla" | "catia" | "taiz" | "simone";
export type LeadOrigin =
  | "whatsapp"
  | "indicacao"
  | "instagram"
  | "facebook"
  | "telegram"
  | "site"
  | "ligacao"
  | "evento";
export type PipelineStage =
  | "novo"
  | "qualificacao"
  | "cotacao"
  | "proposta"
  | "fechamento"
  | "ganho"
  | "perdido";
export type GapId =
  | "cidade"
  | "vidas"
  | "idades"
  | "plano_atual"
  | "urgencia"
  | "cnpj"
  | "indicacao"
  | "operadora";

export interface Org {
  id: string;
  name: string;
  vertical: string;
}

export interface Member {
  id: string;
  orgId: string;
  userId: string;
  email: string | null;
  displayName: string | null;
  role: Role;
  status: MemberStatus;
}

export interface Invite {
  id: string;
  orgId: string;
  email: string;
  role: Role;
  invitedBy: string;
  status: "pending" | "accepted" | "revoked";
  createdAt: string;
}

export interface Conversation {
  id: string;
  orgId: string;
  channel: ChannelId;
  contactName: string;
  contactHandle: string;
  contactKind: ContactKind;
  preview: string;
  status: ConversationStatus;
  assignedUserId: string | null;
  assignedAgent: AgentHandoff | null;
  unread: number;
  lastAt: string;
  origin: LeadOrigin;
  referredBy: string;
  stage: PipelineStage;
  city: string;
  currentPlan: string;
  lives: number | null;
  missing: GapId[];
}

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  authorLabel: string;
  body: string;
  createdAt: string;
}

export interface ChannelAccount {
  channel: ChannelId;
  status: "demo" | "connected" | "disconnected";
  label: string;
}

export interface OrgStats {
  open: number;
  waiting: number;
  unread: number;
  team: number;
}

export interface SessionPayload {
  org: Org;
  member: Member;
  stats: OrgStats;
}
