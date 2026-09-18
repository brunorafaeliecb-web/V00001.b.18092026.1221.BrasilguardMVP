import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  canAdmin,
  canAssignRole,
  canManageTeam,
  CHANNEL_ORDER,
  CHANNELS,
  formatFicha,
  inferGaps,
} from "./catalog";
import { asInt } from "./iso";
import {
  countActiveAdmins,
  ensureMembership,
  insertLead,
  mapChannel,
  mapConversation,
  mapInvite,
  mapMember,
  mapMessage,
} from "./membership";
import { LEAD_POOL } from "./seed-inbox";
import type {
  AgentHandoff,
  ChannelAccount,
  ChannelId,
  Conversation,
  ConversationStatus,
  Invite,
  Member,
  Message,
  OrgStats,
  Role,
  SessionPayload,
} from "./types";

const ChannelSchema = z.enum(["whatsapp", "telegram", "instagram", "messenger", "direct"]);
const RoleSchema = z.enum(["operator", "supervisor", "admin"]);
const StatusSchema = z.enum(["aberto", "em_atendimento", "aguardando", "handoff", "resolvido"]);
const AgentSchema = z.enum(["ana", "carla", "catia", "taiz", "simone"]);
const OriginSchema = z.enum([
  "whatsapp",
  "indicacao",
  "instagram",
  "facebook",
  "telegram",
  "site",
  "ligacao",
  "evento",
]);
const StageSchema = z.enum([
  "novo",
  "qualificacao",
  "cotacao",
  "proposta",
  "fechamento",
  "ganho",
  "perdido",
]);
const GapSchema = z.enum([
  "cidade",
  "vidas",
  "idades",
  "plano_atual",
  "urgencia",
  "cnpj",
  "indicacao",
  "operadora",
]);
const KindSchema = z.enum(["pf", "pj"]);

async function statsFor(orgId: string): Promise<OrgStats> {
  const sql = await getSql();
  const convo = await sql<{ open: number; waiting: number; unread: number }>`
    select
      count(*) filter (where status <> ${"resolvido"})::int as open,
      count(*) filter (where status = ${"aguardando"})::int as waiting,
      coalesce(sum(unread), 0)::int as unread
    from conversations
    where org_id = ${orgId}
  `;
  const team = await sql<{ n: number }>`
    select count(*)::int as n from org_members
    where org_id = ${orgId} and status = ${"active"}
  `;
  return {
    open: asInt(convo[0]?.open),
    waiting: asInt(convo[0]?.waiting),
    unread: asInt(convo[0]?.unread),
    team: asInt(team[0]?.n),
  };
}

async function loadConversation(orgId: string, id: string) {
  const sql = await getSql();
  const rows = await sql<Record<string, unknown>>`
    select * from conversations where id = ${id} and org_id = ${orgId} limit 1
  `;
  if (!rows[0]) throw new Error("Conversa não encontrada.");
  return mapConversation(rows[0]);
}

export const bootstrapSession = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<SessionPayload> => {
    const { org, member } = await ensureMembership(context.userId);
    const stats = await statsFor(org.id);
    return { org, member, stats };
  });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        channel: ChannelSchema.optional(),
        stage: StageSchema.optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }): Promise<Conversation[]> => {
    const { org } = await ensureMembership(context.userId);
    const sql = await getSql();
    const rows = await sql<Record<string, unknown>>`
      select * from conversations
      where org_id = ${org.id}
      order by last_at desc
    `;
    return rows
      .map(mapConversation)
      .filter((c) => (data.channel ? c.channel === data.channel : true))
      .filter((c) => (data.stage ? c.stage === data.stage : true));
  });

export const getConversation = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(
    async ({
      context,
      data,
    }): Promise<{ conversation: Conversation; messages: Message[] }> => {
      const { org } = await ensureMembership(context.userId);
      const conversation = await loadConversation(org.id, data.id);
      const sql = await getSql();
      const rows = await sql<Record<string, unknown>>`
        select * from messages
        where conversation_id = ${data.id} and org_id = ${org.id}
        order by created_at asc
      `;
      if (conversation.unread > 0) {
        await sql`
          update conversations set unread = 0
          where id = ${data.id} and org_id = ${org.id}
        `;
        conversation.unread = 0;
      }
      return { conversation, messages: rows.map(mapMessage) };
    },
  );

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        conversationId: z.string().min(1),
        body: z.string().min(1).max(4000),
      })
      .parse(input),
  )
  .handler(async ({ context, data }): Promise<{ conversation: Conversation; message: Message }> => {
    const { org, member } = await ensureMembership(context.userId);
    const conversation = await loadConversation(org.id, data.conversationId);
    const body = data.body.trim();
    if (!body) throw new Error("Escreva uma mensagem.");
    const sql = await getSql();
    const id = crypto.randomUUID();
    const author = member.displayName?.split(" ")[0] || "Você";
    const rows = await sql<Record<string, unknown>>`
      insert into messages (id, org_id, conversation_id, direction, author_label, body)
      values (${id}, ${org.id}, ${data.conversationId}, ${"out"}, ${author}, ${body})
      returning *
    `;
    const nextStatus: ConversationStatus =
      conversation.status === "resolvido" || conversation.status === "aberto"
        ? "em_atendimento"
        : conversation.status;
    await sql`
      update conversations
      set preview = ${body},
          last_at = now(),
          unread = 0,
          status = ${nextStatus},
          assigned_user_id = ${context.userId}
      where id = ${data.conversationId} and org_id = ${org.id}
    `;
    return {
      conversation: await loadConversation(org.id, data.conversationId),
      message: mapMessage(rows[0]!),
    };
  });

export const addInternalNote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        conversationId: z.string().min(1),
        body: z.string().min(1).max(4000),
      })
      .parse(input),
  )
  .handler(async ({ context, data }): Promise<Message> => {
    const { org, member } = await ensureMembership(context.userId);
    await loadConversation(org.id, data.conversationId);
    const body = data.body.trim();
    if (!body) throw new Error("Escreva a nota.");
    const sql = await getSql();
    const author = member.displayName?.split(" ")[0] || "Time";
    const rows = await sql<Record<string, unknown>>`
      insert into messages (id, org_id, conversation_id, direction, author_label, body)
      values (${crypto.randomUUID()}, ${org.id}, ${data.conversationId}, ${"note"}, ${author}, ${body})
      returning *
    `;
    return mapMessage(rows[0]!);
  });

export const updateConversation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().min(1),
        status: StatusSchema.optional(),
        assignedAgent: AgentSchema.nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }): Promise<Conversation> => {
    const { org } = await ensureMembership(context.userId);
    const current = await loadConversation(org.id, data.id);
    const sql = await getSql();
    let status = data.status ?? current.status;
    let assignedAgent: AgentHandoff | null =
      data.assignedAgent === undefined ? current.assignedAgent : data.assignedAgent;
    if (data.assignedAgent && !data.status) status = "handoff";
    await sql`
      update conversations
      set status = ${status},
          assigned_agent = ${assignedAgent}
      where id = ${data.id} and org_id = ${org.id}
    `;
    return loadConversation(org.id, data.id);
  });

export const updateCrm = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().min(1),
        contactName: z.string().min(2).max(80).optional(),
        contactHandle: z.string().min(3).max(40).optional(),
        contactKind: KindSchema.optional(),
        origin: OriginSchema.optional(),
        referredBy: z.string().max(80).optional(),
        stage: StageSchema.optional(),
        city: z.string().max(80).optional(),
        currentPlan: z.string().max(80).optional(),
        lives: z.number().int().min(1).max(999).nullable().optional(),
        missing: z.array(GapSchema).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }): Promise<Conversation> => {
    const { org } = await ensureMembership(context.userId);
    const current = await loadConversation(org.id, data.id);
    const contactName = data.contactName?.trim() ?? current.contactName;
    const contactHandle = data.contactHandle?.trim() ?? current.contactHandle;
    const contactKind = data.contactKind ?? current.contactKind;
    const origin = data.origin ?? current.origin;
    const referredBy = data.referredBy !== undefined ? data.referredBy.trim() : current.referredBy;
    const stage = data.stage ?? current.stage;
    const city = data.city !== undefined ? data.city.trim() : current.city;
    const currentPlan = data.currentPlan !== undefined ? data.currentPlan.trim() : current.currentPlan;
    const lives = data.lives === undefined ? current.lives : data.lives;
    const missing =
      data.missing ??
      inferGaps({ city, lives, currentPlan, origin, referredBy, contactKind });
    let status: ConversationStatus = current.status;
    if (stage === "ganho" || stage === "perdido") status = "resolvido";
    else if (current.status === "resolvido" && stage !== current.stage) status = "em_atendimento";
    const sql = await getSql();
    await sql`
      update conversations
      set contact_name = ${contactName},
          contact_handle = ${contactHandle},
          contact_kind = ${contactKind},
          origin = ${origin},
          referred_by = ${referredBy},
          stage = ${stage},
          city = ${city},
          current_plan = ${currentPlan},
          lives = ${lives},
          missing = ${JSON.stringify(missing)},
          status = ${status}
      where id = ${data.id} and org_id = ${org.id}
    `;
    return loadConversation(org.id, data.id);
  });

export const createLead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        contactName: z.string().min(2).max(80),
        contactHandle: z.string().min(3).max(40),
        contactKind: KindSchema,
        origin: OriginSchema,
        referredBy: z.string().max(80).optional(),
        city: z.string().max(80).optional(),
        currentPlan: z.string().max(80).optional(),
        lives: z.number().int().min(1).max(999).nullable().optional(),
        firstMessage: z.string().max(4000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }): Promise<Conversation> => {
    const { org } = await ensureMembership(context.userId);
    const name = data.contactName.trim();
    const handle = data.contactHandle.trim();
    const referredBy = data.referredBy?.trim() ?? "";
    const city = data.city?.trim() ?? "";
    const currentPlan = data.currentPlan?.trim() ?? "";
    const lives = data.lives ?? null;
    const first = data.firstMessage?.trim() ?? "";
    const missing = inferGaps({
      city,
      lives,
      currentPlan,
      origin: data.origin,
      referredBy,
      contactKind: data.contactKind,
    });
    const sql = await getSql();
    const dup = await sql<{ id: string }>`
      select id from conversations
      where org_id = ${org.id} and contact_handle = ${handle}
      limit 1
    `;
    if (dup[0]) throw new Error("Já existe uma ficha com este telefone.");
    const id = await insertLead(
      sql,
      org.id,
      {
        contactName: name,
        contactHandle: handle,
        contactKind: data.contactKind,
        origin: data.origin,
        referredBy,
        stage: "novo",
        city,
        currentPlan,
        lives,
        missing,
        messages: first
          ? [{ direction: "in", authorLabel: name, body: first, minutesAgo: 0 }]
          : [],
      },
      { status: "aberto", assignedAgent: null },
    );
    return loadConversation(org.id, id);
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { org } = await ensureMembership(context.userId);
    await loadConversation(org.id, data.id);
    const sql = await getSql();
    await sql`delete from conversations where id = ${data.id} and org_id = ${org.id}`;
    return { ok: true };
  });

export const simulateLead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({}).parse(input ?? {}))
  .handler(async ({ context }): Promise<Conversation> => {
    const { org } = await ensureMembership(context.userId);
    const sql = await getSql();
    const existing = await sql<{ handle: string }>`
      select contact_handle as handle from conversations where org_id = ${org.id}
    `;
    const used = new Set(existing.map((r) => r.handle));
    const lead = LEAD_POOL.find((l) => !used.has(l.contactHandle)) ?? LEAD_POOL[Math.floor(Math.random() * LEAD_POOL.length)]!;
    const id = await insertLead(sql, org.id, lead, { status: "aberto", assignedAgent: null });
    return loadConversation(org.id, id);
  });

export const draftAnaReply = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ conversationId: z.string().min(1) }).parse(input),
  )
  .handler(async ({ context, data }): Promise<{ conversation: Conversation; message: Message }> => {
    const { org } = await ensureMembership(context.userId);
    const conversation = await loadConversation(org.id, data.conversationId);
    const sql = await getSql();
    const history = await sql<Record<string, unknown>>`
      select * from messages
      where conversation_id = ${data.conversationId} and org_id = ${org.id}
      order by created_at asc
    `;
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error("Ana está sem API neste ambiente. Acopla o SuperGrok ou tenta de novo.");
    }
    const transcript = history
      .map(mapMessage)
      .filter((m) => m.direction !== "note")
      .map((m) => `${m.direction === "in" ? conversation.contactName : m.authorLabel}: ${m.body}`)
      .join("\n");
    const ficha = formatFicha(conversation);
    const system = `Você é Ana, agente de atendimento da BrasilGuarD para a corretora de planos de saúde Aliança Saúde (RJ).
Responda em português do Brasil, no tamanho de uma mensagem de WhatsApp (2 a 5 frases).
Não invente preços, carências, prazos da ANS, nomes de produtos ou coberturas que não estejam na conversa ou na ficha.
A ficha CRM é a memória do corretor. Use o que já está nela. Se algo consta em "Falta na conversa", pergunte UMA coisa que falta — a mais útil agora.
Qualifique: vidas, cidade, operadora atual, PF ou PJ, urgência, quem indicou se a origem for indicação.
Se for PF ou MEI, indique a Carla. Se for PJ / CNPJ / empresarial, indique a Cátia.
Tom humano, direto, sem assinatura corporativa e sem emoji.`;
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.6,
        max_tokens: 420,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `Ficha CRM:\n${ficha}\n\nConversa:\n${transcript || "(sem histórico)"}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("Cota da Ana cheia por um instante. Tenta de novo.");
      throw new Error("Ana não conseguiu redigir agora.");
    }
    const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = payload.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("Ana devolveu uma resposta vazia.");
    const inserted = await sql<Record<string, unknown>>`
      insert into messages (id, org_id, conversation_id, direction, author_label, body)
      values (${crypto.randomUUID()}, ${org.id}, ${data.conversationId}, ${"out"}, ${"Ana"}, ${text})
      returning *
    `;
    await sql`
      update conversations
      set preview = ${text},
          last_at = now(),
          unread = 0,
          status = ${"em_atendimento"},
          assigned_agent = ${"ana"}
      where id = ${data.conversationId} and org_id = ${org.id}
    `;
    return {
      conversation: await loadConversation(org.id, data.conversationId),
      message: mapMessage(inserted[0]!),
    };
  });

export const listMembers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Member[]> => {
    const { org, member } = await ensureMembership(context.userId);
    if (!canManageTeam(member.role)) throw new Error("Só supervisor e admin vêem o time.");
    const sql = await getSql();
    const rows = await sql<Record<string, unknown>>`
      select * from org_members where org_id = ${org.id} order by created_at asc
    `;
    return rows.map(mapMember);
  });

export const listInvites = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Invite[]> => {
    const { org, member } = await ensureMembership(context.userId);
    if (!canManageTeam(member.role)) throw new Error("Só supervisor e admin vêem convites.");
    const sql = await getSql();
    const rows = await sql<Record<string, unknown>>`
      select * from org_invites
      where org_id = ${org.id}
      order by created_at desc
    `;
    return rows.map(mapInvite);
  });

export const inviteMember = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ email: z.string().email(), role: RoleSchema }).parse(input),
  )
  .handler(async ({ context, data }): Promise<Invite> => {
    const { org, member } = await ensureMembership(context.userId);
    if (!canManageTeam(member.role)) throw new Error("Você não convoca gente.");
    if (!canAssignRole(member.role, data.role)) {
      throw new Error("Supervisor só convoca operadores.");
    }
    const email = data.email.trim().toLowerCase();
    const sql = await getSql();
    const already = await sql<{ id: string }>`
      select id from org_members
      where org_id = ${org.id} and lower(email) = ${email}
      limit 1
    `;
    if (already[0]) throw new Error("Este e-mail já está no time.");
    const pending = await sql<{ id: string }>`
      select id from org_invites
      where org_id = ${org.id} and lower(email) = ${email} and status = ${"pending"}
      limit 1
    `;
    if (pending[0]) throw new Error("Já existe um convite pendente para este e-mail.");
    const rows = await sql<Record<string, unknown>>`
      insert into org_invites (id, org_id, email, role, invited_by, status)
      values (${crypto.randomUUID()}, ${org.id}, ${email}, ${data.role}, ${context.userId}, ${"pending"})
      returning *
    `;
    return mapInvite(rows[0]!);
  });

export const revokeInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { org, member } = await ensureMembership(context.userId);
    if (!canManageTeam(member.role)) throw new Error("Você não revoga convites.");
    const sql = await getSql();
    const rows = await sql<Record<string, unknown>>`
      select * from org_invites where id = ${data.id} and org_id = ${org.id} limit 1
    `;
    if (!rows[0]) throw new Error("Convite não encontrado.");
    const invite = mapInvite(rows[0]);
    if (invite.status !== "pending") throw new Error("Este convite já foi encerrado.");
    if (!canAssignRole(member.role, invite.role)) {
      throw new Error("Supervisor só revoga convite de operador.");
    }
    await sql`
      update org_invites set status = ${"revoked"}
      where id = ${data.id} and org_id = ${org.id}
    `;
    return { ok: true };
  });

export const updateMember = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().min(1),
        role: RoleSchema.optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }): Promise<Member> => {
    const { org, member: actor } = await ensureMembership(context.userId);
    if (!canManageTeam(actor.role)) throw new Error("Você não edita o time.");
    const sql = await getSql();
    const rows = await sql<Record<string, unknown>>`
      select * from org_members where id = ${data.id} and org_id = ${org.id} limit 1
    `;
    if (!rows[0]) throw new Error("Membro não encontrado.");
    const target = mapMember(rows[0]);
    if (target.id === actor.id && data.status === "inactive") {
      throw new Error("Você não pode desativar a si mesmo.");
    }
    if (actor.role === "supervisor" && target.role !== "operator") {
      throw new Error("Supervisor só gerencia operadores.");
    }
    const nextRole = data.role ?? target.role;
    const nextStatus = data.status ?? target.status;
    if (data.role && !canAssignRole(actor.role, data.role)) {
      throw new Error("Supervisor só atribui papel de operador.");
    }
    if (target.role === "admin" && (nextRole !== "admin" || nextStatus === "inactive")) {
      const n = await countActiveAdmins(sql, org.id);
      if (n <= 1) throw new Error("Não dá para desativar o último administrador.");
    }
    await sql`
      update org_members
      set role = ${nextRole}, status = ${nextStatus}
      where id = ${data.id} and org_id = ${org.id}
    `;
    const updated = await sql<Record<string, unknown>>`
      select * from org_members where id = ${data.id} and org_id = ${org.id} limit 1
    `;
    return mapMember(updated[0]!);
  });

export const updateOrg = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ name: z.string().min(2).max(80) }).parse(input),
  )
  .handler(async ({ context, data }): Promise<{ name: string }> => {
    const { org, member } = await ensureMembership(context.userId);
    if (!canAdmin(member.role)) throw new Error("Só o administrador altera a casa.");
    const name = data.name.trim();
    if (name.length < 2) throw new Error("Nome curto demais.");
    const sql = await getSql();
    await sql`update orgs set name = ${name} where id = ${org.id}`;
    return { name };
  });

export const listChannels = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ChannelAccount[]> => {
    const { org } = await ensureMembership(context.userId);
    const sql = await getSql();
    const rows = await sql<Record<string, unknown>>`
      select * from channel_accounts where org_id = ${org.id}
    `;
    const mapped = rows.map(mapChannel);
    const byId = new Map(mapped.map((c) => [c.channel, c]));
    return CHANNEL_ORDER.map((id) => {
      const row = byId.get(id);
      if (row) return row;
      return {
        channel: id as ChannelId,
        status: CHANNELS[id].live ? "demo" : "disconnected",
        label: CHANNELS[id].name,
      };
    });
  });
