import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AGENTS, AGENT_ORDER } from "./catalog";
import { allSeedThreads, DEFAULT_BRIEF, seedCampaigns, seedPosts, seedTickets } from "./seed";
import type {
  AgentId,
  Campaign,
  ChatMessage,
  CouplingMode,
  PendingBridge,
  ProviderConfig,
  ProviderId,
  SalaSession,
  SocialPost,
  Thread,
  Ticket,
  TicketStatus,
} from "./types";
import { uid } from "@/lib/utils";

type ProviderMap = Record<ProviderId, ProviderConfig>;
type BindingMap = Record<AgentId, ProviderId>;

const defaultProviders = (): ProviderMap => ({
  grok: { coupled: true, mode: "api", apiKey: "", model: "grok-4.5" },
  gemini: { coupled: true, mode: "web", apiKey: "", model: "gemini-2.0-flash" },
  chatgpt: { coupled: true, mode: "web", apiKey: "", model: "gpt-4o" },
});

const defaultBindings = (): BindingMap => ({
  ana: "grok",
  carla: "chatgpt",
  catia: "chatgpt",
  taiz: "gemini",
  simone: "grok",
});

export interface QuatroState {
  hydrated: boolean;
  workspaceName: string;
  companyBrief: string;
  providers: ProviderMap;
  bindings: BindingMap;
  threads: Thread[];
  tickets: Ticket[];
  campaigns: Campaign[];
  posts: SocialPost[];
  pendingBridge: PendingBridge | null;
  sala: SalaSession | null;
  setHydrated: () => void;
  setWorkspaceName: (name: string) => void;
  setCompanyBrief: (brief: string) => void;
  setCoupled: (id: ProviderId, coupled: boolean) => void;
  setProviderMode: (id: ProviderId, mode: CouplingMode) => void;
  setProviderKey: (id: ProviderId, apiKey: string) => void;
  setProviderModel: (id: ProviderId, model: string) => void;
  bindAgent: (agentId: AgentId, providerId: ProviderId) => void;
  ensureThread: (id: string, patch: Partial<Thread> & { agentId: AgentId }) => string;
  openTicketThread: (ticketId: string) => string;
  setTicketStatus: (ticketId: string, status: TicketStatus) => void;
  appendMessage: (threadId: string, message: Omit<ChatMessage, "id" | "createdAt"> & { id?: string }) => void;
  setPendingBridge: (bridge: PendingBridge | null) => void;
  resolveBridge: (content: string) => void;
  setCampaignOutput: (id: string, output: string) => void;
  setPostCaption: (id: string, caption: string) => void;
  setSala: (sala: SalaSession | null) => void;
  patchSalaTurn: (agentId: AgentId, patch: Partial<SalaSession["turns"][number]>) => void;
  setSalaSynthesis: (text: string) => void;
  resetLocal: () => void;
}

function firstCoupled(providers: ProviderMap, preferred: ProviderId): ProviderId | null {
  if (providers[preferred]?.coupled) return preferred;
  const order: ProviderId[] = ["grok", "gemini", "chatgpt"];
  return order.find((id) => providers[id].coupled) ?? null;
}

export const useQuatroStore = create<QuatroState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      workspaceName: "BrasilGuarD",
      companyBrief: DEFAULT_BRIEF,
      providers: defaultProviders(),
      bindings: defaultBindings(),
      threads: allSeedThreads(),
      tickets: seedTickets,
      campaigns: seedCampaigns,
      posts: seedPosts,
      pendingBridge: null,
      sala: null,
      setHydrated: () => set({ hydrated: true }),
      setWorkspaceName: (workspaceName) => set({ workspaceName }),
      setCompanyBrief: (companyBrief) => set({ companyBrief }),
      setCoupled: (id, coupled) => {
        const providers = { ...get().providers, [id]: { ...get().providers[id], coupled } };
        const bindings = { ...get().bindings };
        if (!coupled) {
          for (const agentId of AGENT_ORDER) {
            if (bindings[agentId] === id) {
              const next = firstCoupled(providers, AGENTS[agentId].defaultProvider);
              if (next) bindings[agentId] = next;
            }
          }
        }
        set({ providers, bindings });
      },
      setProviderMode: (id, mode) =>
        set({
          providers: { ...get().providers, [id]: { ...get().providers[id], mode } },
        }),
      setProviderKey: (id, apiKey) =>
        set({
          providers: { ...get().providers, [id]: { ...get().providers[id], apiKey } },
        }),
      setProviderModel: (id, model) =>
        set({
          providers: { ...get().providers, [id]: { ...get().providers[id], model } },
        }),
      bindAgent: (agentId, providerId) => {
        if (!get().providers[providerId].coupled) return;
        set({ bindings: { ...get().bindings, [agentId]: providerId } });
      },
      ensureThread: (id, patch) => {
        const existing = get().threads.find((th) => th.id === id);
        if (existing) {
          if (patch.title) {
            set({
              threads: get().threads.map((th) =>
                th.id === id ? { ...th, ...patch, updatedAt: Date.now() } : th,
              ),
            });
          }
          return id;
        }
        const thread: Thread = {
          id,
          title: patch.title ?? AGENTS[patch.agentId].role,
          messages: patch.messages ?? [],
          updatedAt: Date.now(),
          agentId: patch.agentId,
          source: patch.source,
        };
        set({ threads: [thread, ...get().threads] });
        return id;
      },
      openTicketThread: (ticketId) => {
        const ticket = get().tickets.find((tk) => tk.id === ticketId);
        if (!ticket) return "";
        get().ensureThread(ticket.threadId, {
          agentId: "ana",
          title: `${ticket.name.split(" ")[0]} · ${ticket.channel}`,
          source: "ticket",
        });
        if (ticket.status === "aberto") {
          get().setTicketStatus(ticketId, "em_atendimento");
        }
        return ticket.threadId;
      },
      setTicketStatus: (ticketId, status) =>
        set({
          tickets: get().tickets.map((tk) => (tk.id === ticketId ? { ...tk, status } : tk)),
        }),
      appendMessage: (threadId, message) => {
        const full: ChatMessage = {
          id: message.id ?? uid(),
          createdAt: Date.now(),
          role: message.role,
          content: message.content,
          providerId: message.providerId,
          mode: message.mode,
        };
        set({
          threads: get().threads.map((th) =>
            th.id === threadId
              ? { ...th, messages: [...th.messages, full], updatedAt: Date.now() }
              : th,
          ),
        });
      },
      setPendingBridge: (pendingBridge) => set({ pendingBridge }),
      resolveBridge: (content) => {
        const pending = get().pendingBridge;
        if (!pending) return;
        get().appendMessage(pending.threadId, {
          role: "assistant",
          content,
          providerId: pending.providerId,
          mode: "web",
        });
        set({ pendingBridge: null });
      },
      setCampaignOutput: (id, output) =>
        set({
          campaigns: get().campaigns.map((c) =>
            c.id === id ? { ...c, output, status: "pronta" } : c,
          ),
        }),
      setPostCaption: (id, caption) =>
        set({
          posts: get().posts.map((p) =>
            p.id === id ? { ...p, caption, status: "pronto" } : p,
          ),
        }),
      setSala: (sala) => set({ sala }),
      patchSalaTurn: (agentId, patch) => {
        const sala = get().sala;
        if (!sala) return;
        set({
          sala: {
            ...sala,
            turns: sala.turns.map((t) => (t.agentId === agentId ? { ...t, ...patch } : t)),
          },
        });
      },
      setSalaSynthesis: (synthesis) => {
        const sala = get().sala;
        if (!sala) return;
        set({ sala: { ...sala, synthesis } });
      },
      resetLocal: () =>
        set({
          workspaceName: "BrasilGuarD",
          companyBrief: DEFAULT_BRIEF,
          providers: defaultProviders(),
          bindings: defaultBindings(),
          threads: allSeedThreads(),
          tickets: seedTickets,
          campaigns: seedCampaigns,
          posts: seedPosts,
          pendingBridge: null,
          sala: null,
        }),
    }),
    {
      name: "brasilguard-v1",
      skipHydration: true,
      partialize: (s) => ({
        workspaceName: s.workspaceName,
        companyBrief: s.companyBrief,
        providers: s.providers,
        bindings: s.bindings,
        threads: s.threads,
        tickets: s.tickets,
        campaigns: s.campaigns,
        posts: s.posts,
        sala: s.sala,
      }),
    },
  ),
);

export function getThread(threadId: string) {
  return useQuatroStore.getState().threads.find((th) => th.id === threadId);
}

export function bindingOf(agentId: AgentId) {
  const { bindings, providers } = useQuatroStore.getState();
  const providerId = bindings[agentId];
  const provider = providers[providerId];
  return { providerId, provider };
}
