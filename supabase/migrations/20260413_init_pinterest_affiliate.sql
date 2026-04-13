create extension if not exists "pgcrypto";

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  theme text not null,
  amazon_keywords text[] not null default '{}',
  posts_per_day int not null default 3,
  posting_hours int[] not null default array[9, 14, 20],
  board_id text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  asin text not null,
  product_name text not null,
  product_category text,
  affiliate_url text not null,
  image_url text,
  price text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.pins (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  affiliate_link_id uuid not null references public.affiliate_links(id) on delete cascade,
  title text not null,
  description text not null,
  hashtags text[] not null default '{}',
  image_url text,
  pinterest_pin_id text,
  pin_format text not null check (pin_format in ('single', 'collage')),
  variant text not null default 'a',
  status text not null default 'queued',
  posted_at timestamptz,
  impressions int not null default 0,
  saves int not null default 0,
  clicks int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_affiliate_links_campaign_id
  on public.affiliate_links (campaign_id);

create index if not exists idx_pins_campaign_id
  on public.pins (campaign_id);

create index if not exists idx_pins_affiliate_link_id
  on public.pins (affiliate_link_id);

insert into storage.buckets (id, name, public)
values ('pin-images', 'pin-images', true)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;
