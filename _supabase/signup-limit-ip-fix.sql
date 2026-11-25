-- CLOUDD: make the signup rate limit use an IP visitors can't fake (2026-11-25)
-- Paste the WHOLE file into the Supabase SQL editor and click Run once.
-- One transaction: if anything fails, nothing changes.
--
-- Tested from outside before writing this:
--  * A visitor-supplied X-Forwarded-For header is kept and put FIRST
--    (x-forwarded-for went from 1 entry to 2), so the old guard, which read
--    the first entry, could be bypassed with a fake header on every request.
--  * cf-connecting-ip is set by Cloudflare; a request that tries to supply it
--    is rejected by Cloudflare (error 1000). So it is the visitor's real IP.

begin;

create or replace function public.signup_guard()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  h json := coalesce(current_setting('request.headers', true), '{}')::json;
  xff text[];
  v_ip text;
  per_ip int;
  overall int;
begin
  -- Real visitor IP: Cloudflare's header first. If it's ever missing, use the
  -- LAST x-forwarded-for entry (added by the proxy, not the visitor).
  xff := string_to_array(coalesce(h ->> 'x-forwarded-for', ''), ',');
  v_ip := coalesce(
    nullif(trim(h ->> 'cf-connecting-ip'), ''),
    nullif(trim(xff[array_length(xff, 1)]), ''),
    'unknown');

  delete from signup_attempts where at < now() - interval '1 day';

  select count(*) filter (where ip = v_ip), count(*)
    into per_ip, overall
  from signup_attempts
  where at > now() - interval '10 minutes';

  if per_ip >= 8 or overall >= 600 then
    raise exception 'too many signups, try again shortly' using errcode = 'P0429';
  end if;

  insert into signup_attempts (ip) values (v_ip);
end $$;
revoke all on function public.signup_guard() from public, anon, authenticated;

-- Remove the temporary header-name check.
drop function if exists public._header_names();

commit;
