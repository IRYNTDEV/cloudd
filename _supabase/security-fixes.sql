-- CLOUDD security fixes (2026-11-20)
-- Run in the Supabase SQL editor, one section at a time, reading the NOTICE output.
-- This folder starts with "_" so GitHub Pages (Jekyll) does not publish it.

------------------------------------------------------------------------------
-- 1. Stop anonymous listing of the `faces` bucket
--
-- The bucket is public, so /storage/v1/object/public/faces/<file> keeps working
-- without any SELECT policy. A SELECT policy only adds the ability to LIST and
-- search the bucket, which is what leaks every guest photo.
-- Uploads from the RSVP form use POST without x-upsert, which needs INSERT only.
------------------------------------------------------------------------------

-- 1a. Look first: every storage.objects policy that touches `faces`.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and (coalesce(qual,'') || coalesce(with_check,'')) ilike '%faces%';

-- 1b. Drop SELECT policies on `faces` that apply to anon/public.
--     ALL-command policies are only reported, never dropped: they may also be
--     what allows uploads. Split those by hand into an INSERT-only policy.
do $$
declare p record;
begin
  for p in
    select policyname, cmd, roles
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual,'') || coalesce(with_check,'')) ilike '%faces%'
      and cmd in ('SELECT','ALL')
      and (roles && array['anon','public']::name[])
  loop
    if p.cmd = 'SELECT' then
      execute format('drop policy %I on storage.objects', p.policyname);
      raise notice 'dropped SELECT policy %', p.policyname;
    else
      raise notice 'REVIEW BY HAND: ALL policy % (roles %) on faces', p.policyname, p.roles;
    end if;
  end loop;
end $$;

-- 1c. Only small JPEGs can be uploaded (the page sends 720x570 JPEGs, ~170 KB).
update storage.buckets
set allowed_mime_types = array['image/jpeg'],
    file_size_limit    = 1048576          -- 1 MB
where id = 'faces';

-- 1d. Anonymous uploads may only create new <uuid>.jpg objects at the bucket root.
--     Skip this if an equivalent INSERT policy already exists (see 1a).
drop policy if exists "faces anon insert uuid jpg" on storage.objects;
create policy "faces anon insert uuid jpg"
  on storage.objects for insert to anon
  with check (
    bucket_id = 'faces'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
  );

-- Verify (should return a 400/empty error, not a file list):
--   curl -X POST -H "apikey: <publishable key>" -H "Authorization: Bearer <publishable key>" \
--        -H 'Content-Type: application/json' \
--        https://bmrhejmutccvjzijuqae.supabase.co/storage/v1/object/list/faces -d '{"prefix":""}'


------------------------------------------------------------------------------
-- 2. Self-signup + over-broad read policies
--
-- DASHBOARD STEP (not SQL): Authentication -> Sign In / Providers ->
--   turn OFF "Allow new users to sign up". Admins can still be invited/added.
--
-- Then make sure no table holding guest data is readable by any logged-in user.
------------------------------------------------------------------------------

-- 2a. Look: policies and grants on the data tables.
select tablename, policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public' and tablename in ('rsvps','tickets','admin_users')
order by tablename, cmd;

select table_name, grantee, string_agg(privilege_type, ',') as privs
from information_schema.role_table_grants
where table_schema = 'public' and table_name in ('rsvps','tickets','admin_users')
  and grantee in ('anon','authenticated')
group by 1,2 order by 1,2;

-- 2b. Flag dangerous ones: a policy for authenticated/public whose condition
--     is empty, `true`, or only checks that someone is logged in.
do $$
declare p record;
begin
  for p in
    select tablename, policyname, cmd, roles, coalesce(qual, with_check, '') as cond
    from pg_policies
    where schemaname = 'public' and tablename in ('rsvps','tickets','admin_users')
      and (roles && array['authenticated','public']::name[])
  loop
    if p.cond = '' or p.cond ilike 'true' or p.cond ~* '^\(?auth\.(uid\(\)|role\(\))'
       and p.cond !~* 'admin' then
      raise warning 'TOO BROAD: %.% (% for %): %', p.tablename, p.policyname, p.cmd, p.roles, p.cond;
    else
      raise notice 'ok-ish (check it mentions admin_users): %.% %: %', p.tablename, p.policyname, p.cmd, p.cond;
    end if;
  end loop;
end $$;

-- 2c. Template for the correct shape. ADAPT the admin_users column names
--     (this assumes admin_users.email holds the admin's auth email), then
--     replace any TOO BROAD policy reported above with these.
--
-- create or replace function public.is_admin()
-- returns boolean language sql stable security definer set search_path = public as $$
--   select exists (select 1 from public.admin_users a
--                  where lower(a.email) = lower(auth.jwt() ->> 'email'));
-- $$;
-- revoke all on function public.is_admin() from public, anon;
-- grant execute on function public.is_admin() to authenticated;
--
-- create policy "admins read rsvps"   on public.rsvps   for select to authenticated using (public.is_admin());
-- create policy "admins read tickets" on public.tickets for select to authenticated using (public.is_admin());
--
-- admin_users itself should have NO policies for anon/authenticated at all.


------------------------------------------------------------------------------
-- 3. Throttle resolve_admin_email (password-guessing oracle)
--
-- Supabase Auth rate-limits signInWithPassword, but an RPC that checks the
-- password itself is not rate-limited. This guard caps attempts:
--   5 per username per 15 min, 30 across all usernames per 15 min.
------------------------------------------------------------------------------

create table if not exists public.admin_login_attempts (
  id         bigint generated always as identity primary key,
  username   text        not null,
  at         timestamptz not null default now()
);
create index if not exists admin_login_attempts_at_idx on public.admin_login_attempts (at);
alter table public.admin_login_attempts enable row level security;   -- no policies: unreachable via API
revoke all on public.admin_login_attempts from anon, authenticated;

create or replace function public.admin_login_guard(p_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare per_user int; overall int;
begin
  delete from admin_login_attempts where at < now() - interval '1 day';

  select count(*) filter (where username = lower(p_username)), count(*)
    into per_user, overall
  from admin_login_attempts
  where at > now() - interval '15 minutes';

  if per_user >= 5 or overall >= 30 then
    raise exception 'too many attempts' using errcode = 'P0429';
  end if;

  insert into admin_login_attempts (username) values (lower(p_username));
end $$;

revoke all on function public.admin_login_guard(text) from public, anon, authenticated;

-- 3b. Wire it in. Get the current definition:
--   select pg_get_functiondef('public.resolve_admin_email(text,text)'::regprocedure);
-- then re-create it with this as the FIRST statement of its body:
--   perform public.admin_login_guard(p_username);
-- (resolve_admin_email must be SECURITY DEFINER, which it already needs in
--  order to read admin_users, so it can call the guard.)
--
-- The admin page shows "Too many attempts" when it sees this error.
-- To unlock early:  delete from public.admin_login_attempts;


------------------------------------------------------------------------------
-- Not changed here (needs the join_list source):
-- * join_list returns {duplicate:true} for a known email, so anyone can test
--   whether an email is on the list. Low risk; to close it, return the same
--   shape for new and existing signups.
-- * list_wall should return only rows with show_on_wall = true (and ideally a
--   moderation flag). Photos of people who opted out still sit in the public
--   bucket under unguessable UUID names; delete them or move wall photos to a
--   separate bucket if that matters.
------------------------------------------------------------------------------
