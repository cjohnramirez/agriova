-- Agriova server schema. Mirrors the phone's SQLite schema (src/db/schema.ts)
-- column for column, so sync is a straight copy rather than a translation.
--
-- Conventions carried over from the phone:
--   * ids are client-generated text UUIDs, valid before a row reaches us;
--   * money is integer centavos, quantities integer thousandths;
--   * calendar dates are 'YYYY-MM-DD' text, instants are Unix milliseconds;
--   * deletes are soft (deleted_at), so a deletion can sync.
--
-- Added on the server only:
--   * synced_at, stamped by the server on every write. Phones pull "everything
--     with synced_at after my last pull", which works whatever their own clocks
--     say. updated_at (the phone's clock) still decides which edit wins.
--   * row level security: a farmer reads and writes only their own rows.
--   * composite foreign keys on (id, owner_id), so a row can only point at a
--     parent owned by the same farmer.

-- --- Shared helpers ---------------------------------------------------------

-- Server clock in Unix milliseconds, the unit every instant column uses.
create function public.now_ms() returns bigint
language sql stable
set search_path = ''
as $$ select (extract(epoch from clock_timestamp()) * 1000)::bigint $$;

-- Stamps synced_at on insert and update.
create function public.stamp_synced_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.synced_at := public.now_ms();
  return new;
end $$;

-- Last write wins on the phone's updated_at. An older edit arriving late (from
-- a phone that was offline) is dropped instead of overwriting a newer one.
-- Returning null skips the update without failing the whole upsert batch.
create function public.keep_newest() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.updated_at < old.updated_at then
    return null;
  end if;
  return new;
end $$;

-- --- Reference data -----------------------------------------------------------

create table public.crop (
  id text primary key,
  name_bis text not null,
  name_en text not null,
  icon text not null,
  shelf_life_days integer not null check (shelf_life_days > 0),
  default_unit text not null check (default_unit in ('kg', 'sack', 'piece', 'bundle')),
  sort_order integer not null default 0,
  updated_at bigint not null default public.now_ms(),
  synced_at bigint not null default public.now_ms()
);

create table public.price_reference (
  id text primary key,
  crop_id text not null references public.crop (id),
  area_code text not null,
  observed_on text not null,
  low_centavos integer not null,
  median_centavos integer not null,
  high_centavos integer not null,
  unit text not null check (unit in ('kg', 'sack', 'piece', 'bundle')),
  updated_at bigint not null default public.now_ms(),
  synced_at bigint not null default public.now_ms(),
  check (low_centavos <= median_centavos and median_centavos <= high_centavos)
);
create index price_reference_crop_area_idx on public.price_reference (crop_id, area_code);

-- --- The farmer ---------------------------------------------------------------

-- Name and barangay from onboarding, so a returning farmer on a new phone
-- skips straight to their farm.
create table public.profile (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  barangay text not null check (length(trim(barangay)) > 0),
  created_at bigint not null default public.now_ms(),
  updated_at bigint not null default public.now_ms()
);

-- --- Farmer-authored data -------------------------------------------------------

create table public.plot (
  id text primary key,
  name text not null,
  area_sqm integer check (area_sqm is null or area_sqm > 0),
  photo_uri text,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  synced_at bigint not null default public.now_ms(),
  unique (id, owner_id)
);

create table public.cycle (
  id text primary key,
  plot_id text not null,
  crop_id text not null references public.crop (id),
  planted_on text not null,
  expected_harvest_on text,
  status text not null default 'growing' check (status in ('growing', 'harvested', 'closed')),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  synced_at bigint not null default public.now_ms(),
  unique (id, owner_id),
  foreign key (plot_id, owner_id) references public.plot (id, owner_id)
);

create table public.expense (
  id text primary key,
  cycle_id text not null,
  category text not null check (
    category in ('seed', 'fertilizer', 'pesticide', 'labor', 'fuel', 'transport', 'rent', 'other')
  ),
  amount_centavos integer not null check (amount_centavos >= 0),
  spent_on text not null,
  note text,
  photo_uri text,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  synced_at bigint not null default public.now_ms(),
  foreign key (cycle_id, owner_id) references public.cycle (id, owner_id)
);

create table public.harvest (
  id text primary key,
  cycle_id text not null,
  quantity_milli integer not null check (quantity_milli > 0),
  unit text not null check (unit in ('kg', 'sack', 'piece', 'bundle')),
  harvested_on text not null,
  quality text check (quality is null or quality in ('good', 'fair', 'poor')),
  photo_uri text,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  synced_at bigint not null default public.now_ms(),
  unique (id, owner_id),
  foreign key (cycle_id, owner_id) references public.cycle (id, owner_id)
);

create table public.sale (
  id text primary key,
  harvest_id text not null,
  channel text not null check (channel in ('marketplace', 'middleman', 'direct')),
  buyer_name text,
  quantity_milli integer not null check (quantity_milli > 0),
  unit_price_centavos integer not null check (unit_price_centavos >= 0),
  total_centavos integer not null check (total_centavos >= 0),
  sold_on text not null,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at bigint not null,
  updated_at bigint not null,
  deleted_at bigint,
  synced_at bigint not null default public.now_ms(),
  foreign key (harvest_id, owner_id) references public.harvest (id, owner_id)
);

-- Pulls read "my rows since my last pull"; this index is that query.
create index plot_pull_idx on public.plot (owner_id, synced_at);
create index cycle_pull_idx on public.cycle (owner_id, synced_at);
create index expense_pull_idx on public.expense (owner_id, synced_at);
create index harvest_pull_idx on public.harvest (owner_id, synced_at);
create index sale_pull_idx on public.sale (owner_id, synced_at);

-- --- Triggers -------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['crop', 'price_reference', 'plot', 'cycle', 'expense', 'harvest', 'sale']
  loop
    execute format(
      'create trigger stamp_synced_at before insert or update on public.%I
       for each row execute function public.stamp_synced_at()', t);
  end loop;
  foreach t in array array['plot', 'cycle', 'expense', 'harvest', 'sale']
  loop
    -- Named to sort before stamp_synced_at: a dropped stale edit must not
    -- bump synced_at either.
    execute format(
      'create trigger a_keep_newest before update on public.%I
       for each row execute function public.keep_newest()', t);
  end loop;
end $$;

-- --- Row level security ------------------------------------------------------------

alter table public.crop enable row level security;
alter table public.price_reference enable row level security;
alter table public.profile enable row level security;

-- Reference data: any signed-in farmer reads it; only the service role writes.
create policy "signed-in farmers read crops" on public.crop
  for select to authenticated using (true);
create policy "signed-in farmers read prices" on public.price_reference
  for select to authenticated using (true);

create policy "farmers read their own profile" on public.profile
  for select to authenticated using (id = (select auth.uid()));
create policy "farmers create their own profile" on public.profile
  for insert to authenticated with check (id = (select auth.uid()));
create policy "farmers update their own profile" on public.profile
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Farmer data: own rows only, for every operation. No delete policy: deletes
-- are soft and arrive as updates, so a hard delete is never needed from a phone.
do $$
declare t text;
begin
  foreach t in array array['plot', 'cycle', 'expense', 'harvest', 'sale']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "farmers read their own rows" on public.%I
       for select to authenticated using (owner_id = (select auth.uid()))', t);
    execute format(
      'create policy "farmers add their own rows" on public.%I
       for insert to authenticated with check (owner_id = (select auth.uid()))', t);
    execute format(
      'create policy "farmers change their own rows" on public.%I
       for update to authenticated
       using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', t);
  end loop;
end $$;

-- --- Starter crops ----------------------------------------------------------------------

-- The same list as src/db/seed.ts. Phones seed it locally for first launch
-- offline; the server copy is what later corrections are made to.
insert into public.crop (id, name_bis, name_en, icon, shelf_life_days, default_unit, sort_order) values
  ('crop-rice', 'Humay', 'Rice', 'Wheat', 365, 'sack', 0),
  ('crop-corn', 'Mais', 'Corn', 'Popcorn', 180, 'sack', 1),
  ('crop-banana', 'Saging', 'Banana', 'Banana', 7, 'kg', 2),
  ('crop-papaya', 'Kapayas', 'Papaya', 'Citrus', 5, 'kg', 3),
  ('crop-mango', 'Mangga', 'Mango', 'Apple', 7, 'kg', 4),
  ('crop-tomato', 'Kamatis', 'Tomato', 'Cherry', 7, 'kg', 5),
  ('crop-okra', 'Okra', 'Okra', 'Bean', 5, 'kg', 6),
  ('crop-moringa', 'Kamunggay', 'Moringa', 'Leaf', 2, 'bundle', 7),
  ('crop-eggplant', 'Talong', 'Eggplant', 'Vegan', 7, 'kg', 8),
  ('crop-bittergourd', 'Paliya', 'Bitter gourd', 'Shrub', 7, 'kg', 9),
  ('crop-stringbean', 'Batong', 'String beans', 'Bean', 5, 'bundle', 10),
  ('crop-cabbage', 'Repolyo', 'Cabbage', 'Salad', 14, 'kg', 11),
  ('crop-chili', 'Katumbal', 'Chili', 'Flame', 10, 'kg', 12),
  ('crop-carrot', 'Karot', 'Carrot', 'Carrot', 21, 'kg', 13),
  ('crop-sweetpotato', 'Kamote', 'Sweet potato', 'Nut', 30, 'kg', 14),
  ('crop-squash', 'Kalabasa', 'Squash', 'Grape', 60, 'kg', 15),
  ('crop-onion', 'Sibuyas', 'Onion', 'Soup', 60, 'kg', 16),
  ('crop-ginger', 'Luy-a', 'Ginger', 'Hop', 60, 'kg', 17),
  ('crop-coconut', 'Lubi', 'Coconut', 'TreePalm', 90, 'piece', 18),
  ('crop-coffee', 'Kape', 'Coffee', 'Cookie', 365, 'sack', 19);
