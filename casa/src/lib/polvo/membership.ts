import { getSql, type Sql } from "@/lib/db";
import { CHANNEL_ORDER, CHANNELS, parseGaps, parseOrigin, parseStage } from "./catalog";
import { asInt, iso } from "./iso";
import { HEALTH_LEADS, type SeedLead } from "./seed-inbox";
import type {
  AgentHandoff,
  ChannelAccount,
  Conversation,
  ConversationStatus,
  Invite,
  Member,
  Message,
  Org,
  Role,
} from "./types";

const ORG_NAME = "Aliança Saúde";
const ORG_VERTICAL = "planos_saude";

type AuthProfile = { id: string; email: string | null; name: string | null };

export function mapOrg(row: Record<string, unknown>): Org {
  return {
    id: String(row.id),
    name: String(row.name),
    vertical: String(row.vertical ?? ORG_VERTICAL),
  };
}

export function mapMember(row: Record<string, unknown>): Member {
  return {
    id: String(row.id),
    orgId: String(row.org_id),
    userId: String(row.user_id),
    email: row.email == null ? null : String(row.email),
    displayName: row.display_name == null ? null : String(row.display_name),
    role: row.role as Role,
    status: row.status === "inactive" ? "inactive" : "active",
  };
}

export function mapInvite(row: Record<string, unknown>): Invite {
  return {
    id: String(row.id),
    orgId: String(row.org_id),
    email: String(row.email),
    role: row.role as Role,
    invitedBy: String(row.invited_by),
    status: row.status as Invite["status"],
    createdAt: iso(row.created_at),
  };
}

export function mapConversation(row: Record<string, unknown>): Conversation {
  const agent = row.assigned_agent;
  const livesRaw = row.lives;
  return {
    id: String(row.id),
    orgId: String(row.org_id),
    channel: row.channel as Conversation["channel"],
    contactName: String(row.contact_name),
    contactHandle: String(row.contact_handle),
    contactKind: row.contact_kind === "pj" ? "pj" : "pf",
    preview: String(row.preview ?? ""),
    status: row.status as ConversationStatus,
    assignedUserId: row.assigned_user_id == null ? null : String(row.assigned_user_id),
    assignedAgent: agent == null || agent === "" ? null : (String(agent) as AgentHandoff),
    unread: asInt(row.unread),
    lastAt: iso(row.last_at),
    origin: parseOrigin(row.origin),
    referredBy: String(row.referred_by ?? ""),
    stage: parseStage(row.stage),
    city: String(row.city ?? ""),
    currentPlan: String(row.current_plan ?? ""),
    lives: livesRaw == null || livesRaw === "" ? null : asInt(livesRaw),
    missing: parseGaps(row.missing),
  };
}

export function mapMessage(row: Record<string, unknown>): Message {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    direction: row.direction as Message["direction"],
    authorLabel: String(row.author_label),
    body: String(row.body),
    createdAt: iso(row.created_at),
  };
}

export function mapChannel(row: Record<string, unknown>): ChannelAccount {
  return {
    channel: row.channel as ChannelAccount["channel"],
    status: row.status as ChannelAccount["status"],
    label: String(row.label),
  };
}

async function loadAuthProfile(sql: Sql, userId: string): Promise<AuthProfile> {
  const rows = await sql<{ id: string; name: string; email: string }>`
    select "id", "name", "email" from "user" where "id" = ${userId} limit 1
  `;
  const row = rows[0];
  if (!row) return { id: userId, email: null, name: null };
  return {
    id: row.id,
    email: row.email?.trim() ? row.email.trim() : null,
    name: row.name?.trim() ? row.name.trim() : null,
  };
}

export async function seedChannels(sql: Sql, orgId: string) {
  for (const channel of CHANNEL_ORDER) {
    const existing = await sql<{ id: string }>`
      select id from channel_accounts where org_id = ${orgId} and channel = ${channel} limit 1
    `;
    if (existing[0]) continue;
    const live = CHANNELS[channel].live;
    await sql`
      insert into channel_accounts (id, org_id, channel, status, label)
      values (
        ${crypto.randomUUID()},
        ${orgId},
        ${channel},
        ${live ? "demo" : "disconnected"},
        ${live ? `${ORG_NAME} · WhatsApp Business` : CHANNELS[channel].name}
      )
    `;
  }
}

const SEED_META: Record<
  string,
  { status: ConversationStatus; assignedAgent: AgentHandoff | null }
> = {
  "Maria Souza": { status: "em_atendimento", assignedAgent: "ana" },
  "Horizonte Clínica Ltda": { status: "handoff", assignedAgent: "catia" },
  "João Pedro Alves": { status: "aberto", assignedAgent: null },
  "Fernanda Lima": { status: "aberto", assignedAgent: null },
  "Ricardo Mota": { status: "handoff", assignedAgent: "carla" },
};

export async function insertLead(
  sql: Sql,
  orgId: string,
  lead: SeedLead,
  extras?: { assignedAgent?: AgentHandoff | null; status?: ConversationStatus },
) {
  const chronological = [...lead.messages].sort((a, b) => b.minutesAgo - a.minutesAgo);
  const last = chronological[chronological.length - 1] ?? lead.messages[0];
  const lastAt = new Date(Date.now() - (last?.minutesAgo ?? 0) * 60_000);
  const unread = last?.direction === "in" ? 1 : 0;
  const meta = SEED_META[lead.contactName];
  const status = extras?.status ?? meta?.status ?? (last?.direction === "in" ? "aberto" : "em_atendimento");
  const assignedAgent = extras?.assignedAgent ?? meta?.assignedAgent ?? null;
  const convId = crypto.randomUUID();
  const missing = JSON.stringify(lead.missing);

  await sql`
    insert into conversations (
      id, org_id, channel, contact_name, contact_handle, contact_kind,
      preview, status, assigned_agent, unread, last_at,
      origin, referred_by, stage, city, current_plan, lives, missing
    ) values (
      ${convId},
      ${orgId},
      ${"whatsapp"},
      ${lead.contactName},
      ${lead.contactHandle},
      ${lead.contactKind},
      ${last?.body ?? ""},
      ${status},
      ${assignedAgent},
      ${unread},
      ${lastAt.toISOString()},
      ${lead.origin},
      ${lead.referredBy},
      ${lead.stage},
      ${lead.city},
      ${lead.currentPlan},
      ${lead.lives},
      ${missing}
    )
  `;

  for (const msg of chronological) {
    const created = new Date(Date.now() - msg.minutesAgo * 60_000);
    await sql`
      insert into messages (id, org_id, conversation_id, direction, author_label, body, created_at)
      values (
        ${crypto.randomUUID()},
        ${orgId},
        ${convId},
        ${msg.direction},
        ${msg.authorLabel},
        ${msg.body},
        ${created.toISOString()}
      )
    `;
  }

  return convId;
}

export async function backfillCrm(sql: Sql, orgId: string) {
  for (const lead of HEALTH_LEADS) {
    const missing = JSON.stringify(lead.missing);
    await sql`
      update conversations
      set origin = ${lead.origin},
          referred_by = ${lead.referredBy},
          stage = ${lead.stage},
          city = ${lead.city},
          current_plan = ${lead.currentPlan},
          lives = ${lead.lives},
          missing = ${missing}
      where org_id = ${orgId}
        and contact_handle = ${lead.contactHandle}
        and (referred_by = ${""} and city = ${""} and current_plan = ${""})
    `;
  }
}

export async function seedInbox(sql: Sql, orgId: string) {
  const existing = await sql<{ id: string }>`
    select id from conversations where org_id = ${orgId} limit 1
  `;
  if (existing[0]) {
    await backfillCrm(sql, orgId);
    return;
  }
  for (const lead of HEALTH_LEADS) {
    await insertLead(sql, orgId, lead);
  }
}

export async function seedOrg(sql: Sql, userId: string, profile: AuthProfile) {
  const orgId = "alianca-saude";
  await sql`
    insert into orgs (id, name, vertical, created_by)
    values (${orgId}, ${ORG_NAME}, ${ORG_VERTICAL}, ${userId})
    on conflict (id) do nothing
  `;
  const already = await sql<Record<string, unknown>>`
    select * from org_members where user_id = ${userId} limit 1
  `;
  if (already[0]) {
    const member = mapMember(already[0]);
    const orgRows = await sql<Record<string, unknown>>`
      select * from orgs where id = ${member.orgId} limit 1
    `;
    if (!orgRows[0]) throw new Error("Organização não encontrada.");
    await seedChannels(sql, member.orgId);
    await seedInbox(sql, member.orgId);
    return { org: mapOrg(orgRows[0]), member };
  }
  const anyone = await sql<{ id: string }>`
    select id from org_members where org_id = ${orgId} limit 1
  `;
  if (anyone[0]) {
    const memberId = crypto.randomUUID();
    await sql`
      insert into org_members (id, org_id, user_id, email, display_name, role, status)
      values (${memberId}, ${orgId}, ${userId}, ${profile.email}, ${profile.name}, ${"operator"}, ${"active"})
    `;
    await seedChannels(sql, orgId);
    await seedInbox(sql, orgId);
    const orgRows = await sql<Record<string, unknown>>`
      select * from orgs where id = ${orgId} limit 1
    `;
    if (!orgRows[0]) throw new Error("Organização não encontrada.");
    return {
      org: mapOrg(orgRows[0]),
      member: {
        id: memberId,
        orgId,
        userId,
        email: profile.email,
        displayName: profile.name,
        role: "operator" as const,
        status: "active" as const,
      } satisfies Member,
    };
  }
  const memberId = crypto.randomUUID();
  try {
    await sql`
      insert into org_members (id, org_id, user_id, email, display_name, role, status)
      values (${memberId}, ${orgId}, ${userId}, ${profile.email}, ${profile.name}, ${"admin"}, ${"active"})
    `;
  } catch {
    const raced = await sql<Record<string, unknown>>`
      select * from org_members where user_id = ${userId} limit 1
    `;
    if (raced[0]) {
      const member = mapMember(raced[0]);
      const orgRows = await sql<Record<string, unknown>>`
        select * from orgs where id = ${orgId} limit 1
      `;
      if (orgRows[0]) return { org: mapOrg(orgRows[0]), member };
    }
    throw new Error("Você precisa de um convite para entrar nesta casa.");
  }
  await seedChannels(sql, orgId);
  await seedInbox(sql, orgId);
  const orgRows = await sql<Record<string, unknown>>`
    select * from orgs where id = ${orgId} limit 1
  `;
  return {
    org: orgRows[0]
      ? mapOrg(orgRows[0])
      : ({ id: orgId, name: ORG_NAME, vertical: ORG_VERTICAL } satisfies Org),
    member: {
      id: memberId,
      orgId,
      userId,
      email: profile.email,
      displayName: profile.name,
      role: "admin" as const,
      status: "active" as const,
    } satisfies Member,
  };
}

export async function ensureMembership(userId: string): Promise<{ org: Org; member: Member }> {
  const sql = await getSql();
  const profile = await loadAuthProfile(sql, userId);

  const existing = await sql<Record<string, unknown>>`
    select * from org_members where user_id = ${userId} order by created_at asc limit 1
  `;
  if (existing[0]) {
    const member = mapMember(existing[0]);
    if (member.status === "inactive") {
      throw new Error("Sua conta nesta casa está desativada. Fale com o administrador.");
    }
    const orgRows = await sql<Record<string, unknown>>`
      select * from orgs where id = ${member.orgId} limit 1
    `;
    if (!orgRows[0]) throw new Error("Organização não encontrada.");
    await seedChannels(sql, member.orgId);
    await seedInbox(sql, member.orgId);
    if (profile.email && !member.email) {
      await sql`
        update org_members set email = ${profile.email}, display_name = coalesce(display_name, ${profile.name})
        where id = ${member.id}
      `;
      member.email = profile.email;
      member.displayName = member.displayName ?? profile.name;
    }
    return { org: mapOrg(orgRows[0]), member };
  }

  if (profile.email) {
    const inviteRows = await sql<Record<string, unknown>>`
      select * from org_invites
      where lower(email) = ${profile.email.toLowerCase()}
        and status = ${"pending"}
      order by created_at desc
      limit 1
    `;
    const invite = inviteRows[0];
    if (invite) {
      const orgId = String(invite.org_id);
      const role = invite.role as Role;
      const memberId = crypto.randomUUID();
      await sql`
        insert into org_members (id, org_id, user_id, email, display_name, role, status)
        values (${memberId}, ${orgId}, ${userId}, ${profile.email}, ${profile.name}, ${role}, ${"active"})
      `;
      await sql`
        update org_invites set status = ${"accepted"} where id = ${String(invite.id)}
      `;
      await seedChannels(sql, orgId);
      await seedInbox(sql, orgId);
      const orgRows = await sql<Record<string, unknown>>`
        select * from orgs where id = ${orgId} limit 1
      `;
      if (!orgRows[0]) throw new Error("Organização do convite não encontrada.");
      return {
        org: mapOrg(orgRows[0]),
        member: {
          id: memberId,
          orgId,
          userId,
          email: profile.email,
          displayName: profile.name,
          role,
          status: "active",
        },
      };
    }
  }

  return seedOrg(sql, userId, profile);
}

export async function countActiveAdmins(sql: Sql, orgId: string) {
  const rows = await sql<{ n: number }>`
    select count(*)::int as n
    from org_members
    where org_id = ${orgId} and role = ${"admin"} and status = ${"active"}
  `;
  return asInt(rows[0]?.n);
}
