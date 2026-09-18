-- Polvo OS: orgs, roles, channels, conversations.
-- user_id stays TEXT (Better Auth ids / preview 'dev-user').

create table if not exists orgs (
  id          text primary key,
  name        text not null,
  vertical    text not null default 'planos_saude',
  created_by  text not null,
  created_at  timestamptz not null default now()
);

create table if not exists org_members (
  id            text primary key,
  org_id        text not null references orgs(id) on delete cascade,
  user_id       text not null,
  email         text,
  display_name  text,
  role          text not null check (role in ('operator', 'supervisor', 'admin')),
  status        text not null default 'active' check (status in ('active', 'inactive')),
  created_at    timestamptz not null default now(),
  unique (org_id, user_id)
);
create index if not exists org_members_user_id_idx on org_members (user_id);
create index if not exists org_members_org_id_idx on org_members (org_id);

create table if not exists org_invites (
  id          text primary key,
  org_id      text not null references orgs(id) on delete cascade,
  email       text not null,
  role        text not null check (role in ('operator', 'supervisor', 'admin')),
  invited_by  text not null,
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at  timestamptz not null default now()
);
create index if not exists org_invites_email_idx on org_invites (lower(email));

create table if not exists conversations (
  id                 text primary key,
  org_id             text not null references orgs(id) on delete cascade,
  channel            text not null check (channel in ('whatsapp', 'telegram', 'instagram', 'messenger', 'direct')),
  contact_name       text not null,
  contact_handle     text not null,
  contact_kind       text not null default 'pf' check (contact_kind in ('pf', 'pj')),
  preview            text not null default '',
  status             text not null default 'aberto' check (status in ('aberto', 'em_atendimento', 'aguardando', 'handoff', 'resolvido')),
  assigned_user_id   text,
  assigned_agent     text,
  unread             integer not null default 0,
  last_at            timestamptz not null default now(),
  created_at         timestamptz not null default now()
);
create index if not exists conversations_org_idx on conversations (org_id, last_at desc);

create table if not exists messages (
  id               text primary key,
  org_id           text not null,
  conversation_id  text not null references conversations(id) on delete cascade,
  direction        text not null check (direction in ('in', 'out', 'note')),
  author_label     text not null,
  body             text not null,
  created_at       timestamptz not null default now()
);
create index if not exists messages_conv_idx on messages (conversation_id, created_at);

create table if not exists channel_accounts (
  id       text primary key,
  org_id   text not null references orgs(id) on delete cascade,
  channel  text not null,
  status   text not null default 'demo' check (status in ('demo', 'connected', 'disconnected')),
  label    text not null,
  unique (org_id, channel)
);
