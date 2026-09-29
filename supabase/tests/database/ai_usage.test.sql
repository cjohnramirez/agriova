-- The assistant's daily limit, checked as a farmer would hit it.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (id, email) values
  ('33333333-3333-3333-3333-333333333333', 'ana@example.com');

select set_config('role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}',
  true
);

select ok(public.ai_use_quota(2), 'the first question of the day is allowed');
select ok(public.ai_use_quota(2), 'so is the second, at a limit of two');
select ok(not public.ai_use_quota(2), 'the third is refused');

select throws_ok(
  $$ select * from public.ai_usage $$,
  '42501',
  null,
  'farmers cannot read the usage table directly'
);

select set_config('role', 'anon', true);
select throws_ok(
  $$ select public.ai_use_quota(20) $$,
  '42501',
  null,
  'signed-out callers cannot use the assistant'
);

select * from finish();
rollback;
