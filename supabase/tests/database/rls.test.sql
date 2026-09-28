-- Row level security and sync rules, checked as two real farmers would hit
-- them. Run with `npm run db:test` (needs Docker) or in CI.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- Two farmers, created as the auth service would.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'nena@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'pedro@example.com');

-- Act as a farmer: the role and JWT claims PostgREST would set.
create function pg_temp.act_as(farmer uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', farmer, 'role', 'authenticated')::text, true);
$$;

-- --- Nena writes her farm -----------------------------------------------------
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');

insert into public.plot (id, name, created_at, updated_at)
values ('plot-nena', 'Duol sa suba', 1000, 1000);
insert into public.cycle (id, plot_id, crop_id, planted_on, created_at, updated_at)
values ('cycle-nena', 'plot-nena', 'crop-tomato', '2026-06-01', 1000, 1000);
insert into public.expense (id, cycle_id, category, amount_centavos, spent_on, created_at, updated_at)
values ('expense-nena', 'cycle-nena', 'seed', 85000, '2026-06-01', 1000, 1000);

select is(
  (select owner_id from public.plot where id = 'plot-nena'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'owner_id defaults to the signed-in farmer'
);
select ok(
  (select synced_at from public.plot where id = 'plot-nena') > 0,
  'the server stamps synced_at'
);
select is((select count(*) from public.crop)::int, 20, 'farmers can read the crop list');

-- --- Pedro cannot see or touch it --------------------------------------------------
select pg_temp.act_as('22222222-2222-2222-2222-222222222222');

select is((select count(*) from public.plot)::int, 0, 'another farmer sees none of her plots');
select is((select count(*) from public.expense)::int, 0, 'another farmer sees none of her expenses');

update public.plot set name = 'Akoa na' where id = 'plot-nena';
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
select is(
  (select name from public.plot where id = 'plot-nena'),
  'Duol sa suba',
  'another farmer''s update changes nothing'
);

select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
select throws_ok(
  $$ insert into public.plot (id, name, owner_id, created_at, updated_at)
     values ('plot-fake', 'Peke', '11111111-1111-1111-1111-111111111111', 1, 1) $$,
  '42501',
  null,
  'a farmer cannot write a row in someone else''s name'
);

insert into public.plot (id, name, created_at, updated_at) values ('plot-pedro', 'Bungtod', 1, 1);
select throws_ok(
  $$ insert into public.cycle (id, plot_id, crop_id, planted_on, created_at, updated_at)
     values ('cycle-sneaky', 'plot-nena', 'crop-corn', '2026-06-01', 1, 1) $$,
  '23503',
  null,
  'a farmer cannot plant on someone else''s plot'
);

select throws_ok(
  $$ insert into public.crop (id, name_bis, name_en, icon, shelf_life_days, default_unit)
     values ('crop-x', 'X', 'X', 'Leaf', 1, 'kg') $$,
  '42501',
  null,
  'farmers cannot change the crop list'
);

-- --- Last write wins on the phone's clock -------------------------------------------
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');

update public.plot set name = 'Bag-o', updated_at = 3000 where id = 'plot-nena';
update public.plot set name = 'Karaan', updated_at = 2000 where id = 'plot-nena';
select is(
  (select name from public.plot where id = 'plot-nena'),
  'Bag-o',
  'an older edit arriving late does not overwrite a newer one'
);

-- The same, through the upsert the sync engine sends.
insert into public.plot (id, name, created_at, updated_at) values ('plot-nena', 'Mas karaan', 1000, 1500)
on conflict (id) do update set name = excluded.name, updated_at = excluded.updated_at;
select is(
  (select name from public.plot where id = 'plot-nena'),
  'Bag-o',
  'a stale upsert is skipped, not failed'
);

insert into public.plot (id, name, created_at, updated_at) values ('plot-nena', 'Pinakabag-o', 1000, 4000)
on conflict (id) do update set name = excluded.name, updated_at = excluded.updated_at;
select is(
  (select name from public.plot where id = 'plot-nena'),
  'Pinakabag-o',
  'a newer upsert applies'
);

-- --- Profiles ---------------------------------------------------------------------------
insert into public.profile (id, name, barangay)
values ('11111111-1111-1111-1111-111111111111', 'Nena', 'Gusa');
select is((select name from public.profile), 'Nena', 'a farmer reads her own profile');

select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
select is((select count(*) from public.profile)::int, 0, 'and nobody else can');

select * from finish();
rollback;
