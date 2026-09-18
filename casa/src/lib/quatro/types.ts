export type AgentId = "ana" | "carla" | "catia" | "taiz" | "simone";
export type ProviderId = "grok" | "gemini" | "chatgpt";
export type CouplingMode = "api" | "web";
export type TicketChannel = "whatsapp" | "instagram" | "email" | "site";
export type TicketStatus = "aberto" | "em_atendimento" | "handoff" | "resolvido";
export type CampaignPlatform = "meta" | "google" | "tiktok";
export type SocialChannel = "instagram" | "linkedin" | "reels" | "stories";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  providerId?: ProviderId;
  mode?: CouplingMode;
}

export interface Thread {
  id: string;
  agentId: AgentId;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
  source?: "chat" | "ticket" | "campaign" | "post" | "sala";
}

export interface ProviderConfig {
  coupled: boolean;
  mode: CouplingMode;
  apiKey: string;
  model: string;
}

export interface Ticket {
  id: string;
  name: string;
  channel: TicketChannel;
  preview: string;
  status: TicketStatus;
  threadId: string;
  createdAt: number;
}

export interface Campaign {
  id: string;
  name: string;
  platform: CampaignPlatform;
  objective: string;
  status: "rascunho" | "pronta";
  brief: string;
  output: string;
  threadId: string;
}

export interface SocialPost {
  id: string;
  date: string;
  channel: SocialChannel;
  title: string;
  caption: string;
  status: "ideia" | "pronto";
  threadId: string;
}

export interface PendingBridge {
  threadId: string;
  agentId: AgentId;
  providerId: ProviderId;
  packageText: string;
}

export interface SalaTurn {
  agentId: AgentId;
  content: string;
  status: "idle" | "waiting-web" | "done";
  packageText?: string;
}

export interface SalaSession {
  id: string;
  brief: string;
  agentIds: AgentId[];
  turns: SalaTurn[];
  synthesis: string;
  createdAt: number;
}
