-- WhatsApp CRM: origem, indicação, estágio e o que falta na conversa.
alter table conversations add column if not exists origin text not null default 'whatsapp';
alter table conversations add column if not exists referred_by text not null default '';
alter table conversations add column if not exists stage text not null default 'novo';
alter table conversations add column if not exists city text not null default '';
alter table conversations add column if not exists current_plan text not null default '';
alter table conversations add column if not exists lives integer;
alter table conversations add column if not exists missing text not null default '[]';
