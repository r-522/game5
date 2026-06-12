-- ════════════════════════════════════════════════════════════════════════
-- 喧嘩番長7 ―最後の番長― : Supabase schema
-- すべてのオブジェクトは knk_ 接頭辞。Supabase の SQL Editor に貼って実行。
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- 番長（プレイヤー）。縄張りの平和度は territories(jsonb) にまとめて保存する。
create table if not exists knk_players (
  id          uuid primary key,
  name        text        not null default '名無しの番長',
  otokogi     integer     not null default 50,   -- 男気 0..100
  bancho_do   integer     not null default 1,     -- 番長度
  kenka_nare  integer     not null default 0,     -- 喧嘩慣れ度
  wins        integer     not null default 0,
  equipped    jsonb       not null default '[]'::jsonb,
  unlocked    jsonb       not null default '[]'::jsonb,
  territories jsonb       not null default '{}'::jsonb,  -- { districtKey: peace }
  updated_at  timestamptz not null default now()
);

create index if not exists knk_players_ranking_idx
  on knk_players (bancho_do desc, otokogi desc, wins desc);

-- 全国番長ランキング（上位100）
create or replace view knk_ranking as
  select id, name, bancho_do, otokogi, wins, updated_at
  from knk_players
  order by bancho_do desc, otokogi desc, wins desc
  limit 100;

-- ── Row Level Security ──────────────────────────────────────────────────
-- 読み書きは Vercel 側の Route Handler が service role キーで行う（RLSを貫通）。
-- そのため RLS を有効化してブラウザ(anon)からの直接アクセスは既定で遮断する。
alter table knk_players enable row level security;

-- もしブラウザ(anon key)から直接ランキングを読みたい場合のみ、以下を有効化:
-- create policy "knk anon read" on knk_players for select using (true);
