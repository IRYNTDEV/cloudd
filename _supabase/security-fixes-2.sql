-- CLOUDD security fixes, part 2 (2026-11-20)
-- Paste this WHOLE file into the Supabase SQL editor and click Run once.
-- Part A and part B are separate transactions: if B fails, A stays applied
-- and B changes nothing (the login keeps working as before).

begin;

------------------------------------------------------------------------------
-- A. Only admins can read rsvps / tickets
--    Before: "authenticated can read ..." with condition `true`, so ANY
--    logged-in user (and anyone can sign up) could read every row.
------------------------------------------------------------------------------

-- Is the current logged-in user listed in admin_users?
-- Matches on the auth account's real email (looked up by user id, not taken
-- from anything the client sends).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.admin_users a
    join auth.users u on lower(u.email) = lower(a.email)
    where u.id = auth.uid()
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "authenticated can read rsvps"   on public.rsvps;
drop policy if exists "authenticated can read tickets" on public.tickets;

create policy "admins can read rsvps"
  on public.rsvps for select to authenticated
  using (public.is_admin());

create policy "admins can read tickets"
  on public.tickets for select to authenticated
  using (public.is_admin());

alter table public.rsvps   enable row level security;
alter table public.tickets enable row level security;

commit;   -- A is saved even if B below fails
begin;

------------------------------------------------------------------------------
-- B. Rate-limit the admin login lookup
--    The existing function is kept unchanged under a new private name;
--    the public name becomes a thin wrapper that calls the guard first.
--    (admin_login_guard was created by part 1.)
------------------------------------------------------------------------------

alter function public.resolve_admin_email(text, text)
  rename to resolve_admin_email_inner;
revoke all on function public.resolve_admin_email_inner(text, text)
  from public, anon, authenticated;

create function public.resolve_admin_email(p_username text, p_password text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_login_guard(p_username);
  return public.resolve_admin_email_inner(p_username, p_password);
end $$;

revoke all on function public.resolve_admin_email(text, text) from public;
grant execute on function public.resolve_admin_email(text, text) to anon, authenticated;

commit;


------------------------------------------------------------------------------
-- Check afterwards (run on its own) — expect two "admins can read" rows:
--   select tablename, policyname, roles, qual from pg_policies
--   where schemaname = 'public' and tablename in ('rsvps','tickets');
------------------------------------------------------------------------------
