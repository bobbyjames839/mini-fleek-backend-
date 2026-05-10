-- Mini Fleek schema. Apply via Supabase Dashboard → SQL Editor.
-- Safe to re-run: every statement is idempotent.

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table if not exists public.vendors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  country text not null,
  rating numeric(2,1),
  about text,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.vendors
  add column if not exists image_url text;

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  brand text not null,
  photos text[] not null default '{}',
  piece_count int not null check (piece_count > 0),
  total_price int not null check (total_price >= 0),
  price_per_piece int not null check (price_per_piece >= 0),
  original_total_price int check (original_total_price is null or original_total_price >= total_price),
  grade text,
  grading_breakdown jsonb,
  brand_mix jsonb,
  size_split jsonb,
  status text not null default 'active' check (status in ('active','sold_out')),
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists products_vendor_idx on public.products (vendor_id);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_status_idx on public.products (status);

create table if not exists public.cart_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists cart_items_user_idx on public.cart_items (user_id);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'placed' check (status in ('placed','shipped','cancelled')),
  subtotal int not null check (subtotal >= 0),
  total int not null check (total >= 0),
  item_count int not null check (item_count >= 0),
  shipping_full_name text not null,
  shipping_line1 text not null,
  shipping_line2 text,
  shipping_city text not null,
  shipping_postcode text not null,
  shipping_country text not null,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id);

-- Migrations for additive changes. `create table if not exists` above is a
-- no-op once the table exists, so column additions need explicit ALTERs.
alter table public.orders
  add column if not exists item_count int not null default 0 check (item_count >= 0);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_slug text not null,
  primary_photo text,
  vendor_name text not null,
  piece_count int not null,
  quantity int not null check (quantity > 0),
  unit_price int not null check (unit_price >= 0),
  line_total int not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  reviewer_name text not null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text not null,
  created_at timestamptz not null default now()
);

-- Reviews started life as per-product. They are now site-wide testimonials,
-- so drop product_id (and its index) if a previous schema version created it.
alter table public.reviews drop column if exists product_id;
drop index if exists public.reviews_product_idx;

create index if not exists reviews_user_idx on public.reviews (user_id);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

alter table public.vendors      enable row level security;
alter table public.categories   enable row level security;
alter table public.products     enable row level security;
alter table public.cart_items   enable row level security;
alter table public.orders       enable row level security;
alter table public.order_items  enable row level security;
alter table public.reviews      enable row level security;

-- Catalog: public read, writes only via service role (which bypasses RLS).
drop policy if exists "vendors public read"    on public.vendors;
create policy "vendors public read"    on public.vendors    for select using (true);

drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select using (true);

drop policy if exists "products public read"   on public.products;
create policy "products public read"   on public.products   for select using (true);

-- Cart: owner has full access.
drop policy if exists "cart owner select" on public.cart_items;
create policy "cart owner select" on public.cart_items for select using (auth.uid() = user_id);

drop policy if exists "cart owner insert" on public.cart_items;
create policy "cart owner insert" on public.cart_items for insert with check (auth.uid() = user_id);

drop policy if exists "cart owner update" on public.cart_items;
create policy "cart owner update" on public.cart_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "cart owner delete" on public.cart_items;
create policy "cart owner delete" on public.cart_items for delete using (auth.uid() = user_id);

-- Orders: owner reads. Writes go through the server (service role).
drop policy if exists "orders owner select" on public.orders;
create policy "orders owner select" on public.orders for select using (auth.uid() = user_id);

drop policy if exists "order items owner select" on public.order_items;
create policy "order items owner select" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- Reviews: public read. Authenticated users can write reviews scoped to themselves.
drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews for select using (true);

drop policy if exists "reviews owner insert" on public.reviews;
create policy "reviews owner insert" on public.reviews for insert with check (auth.uid() = user_id);

drop policy if exists "reviews owner update" on public.reviews;
create policy "reviews owner update" on public.reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reviews owner delete" on public.reviews;
create policy "reviews owner delete" on public.reviews for delete using (auth.uid() = user_id);
