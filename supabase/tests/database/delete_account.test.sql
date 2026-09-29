-- Deleting a farmer's account removes everything they own, and nothing of
-- anyone else's. The delete-account Edge Function relies on this cascade.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('44444444-4444-4444-4444-444444444444', 'leaving@example.com'),
  ('55555555-5555-5555-5555-555555555555', 'staying@example.com');

-- A full farm for each: profile, plot, cycle, expense, harvest, sale, usage.
do $$
declare u uuid;
begin
  foreach u in array array[
    '44444444-4444-4444-4444-444444444444'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid
  ] loop
    insert into public.profile (id, name, barangay) values (u, 'Farmer', 'Lumbia');
    insert into public.plot (id, name, owner_id, created_at, updated_at)
      values ('plot-' || u, 'Uma', u, 1, 1);
    insert into public.cycle (id, plot_id, crop_id, planted_on, owner_id, created_at, updated_at)
      values ('cycle-' || u, 'plot-' || u, (select id from public.crop limit 1), '2026-06-01', u, 1, 1);
    insert into public.expense (id, cycle_id, category, amount_centavos, spent_on, owner_id, created_at, updated_at)
      values ('expense-' || u, 'cycle-' || u, 'seed', 10000, '2026-06-01', u, 1, 1);
    insert into public.harvest (id, cycle_id, quantity_milli, unit, harvested_on, owner_id, created_at, updated_at)
      values ('harvest-' || u, 'cycle-' || u, 5000, 'kg', '2026-09-01', u, 1, 1);
    insert into public.sale (id, harvest_id, channel, quantity_milli, unit_price_centavos, total_centavos, sold_on, owner_id, created_at, updated_at)
      values ('sale-' || u, 'harvest-' || u, 'direct', 5000, 4000, 20000, '2026-09-02', u, 1, 1);
    insert into public.ai_usage (user_id, day) values (u, '2026-09-29');
  end loop;
end $$;

-- What auth.admin.deleteUser does to the database.
delete from auth.users where id = '44444444-4444-4444-4444-444444444444';

select is((select count(*)::int from public.profile where id = '44444444-4444-4444-4444-444444444444'), 0, 'profile removed');
select is((select count(*)::int from public.plot where owner_id = '44444444-4444-4444-4444-444444444444'), 0, 'plots removed');
select is((select count(*)::int from public.cycle where owner_id = '44444444-4444-4444-4444-444444444444'), 0, 'plantings removed');
select is((select count(*)::int from public.expense where owner_id = '44444444-4444-4444-4444-444444444444'), 0, 'expenses removed');
select is((select count(*)::int from public.harvest where owner_id = '44444444-4444-4444-4444-444444444444'), 0, 'harvests removed');
select is((select count(*)::int from public.sale where owner_id = '44444444-4444-4444-4444-444444444444'), 0, 'sales removed');
select is((select count(*)::int from public.ai_usage where user_id = '44444444-4444-4444-4444-444444444444'), 0, 'assistant usage removed');

select is(
  (select count(*)::int from public.sale where owner_id = '55555555-5555-5555-5555-555555555555'),
  1,
  'another farmer''s records are untouched'
);

select * from finish();
rollback;
