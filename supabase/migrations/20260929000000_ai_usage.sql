-- The farm assistant's daily question limit, per farmer, per Manila date.
--
-- The table has row level security on and no policies, so no client can read
-- or write it directly. The only way in is ai_use_quota(), which counts one
-- question for the signed-in farmer and says whether it is allowed. Checking
-- and counting in one statement means two questions sent at once cannot both
-- slip under the limit.

create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

create function public.ai_use_quota(daily_limit integer) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  used integer;
begin
  if auth.uid() is null then
    return false;
  end if;

  insert into public.ai_usage (user_id, day, count)
  values (auth.uid(), (now() at time zone 'Asia/Manila')::date, 1)
  on conflict (user_id, day) do update
    set count = public.ai_usage.count + 1
    where public.ai_usage.count < daily_limit
  returning count into used;

  -- No row returned: the update was skipped because the limit is reached.
  return used is not null;
end $$;

revoke all on function public.ai_use_quota(integer) from public, anon;
grant execute on function public.ai_use_quota(integer) to authenticated;
