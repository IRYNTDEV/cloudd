-- CLOUDD security fixes, part 3 (2026-11-20): join_list + list_wall
-- Paste the WHOLE file into the Supabase SQL editor and click Run once.
-- One transaction: if anything fails, nothing changes.
--
-- What changes:
--  * join_list is rate-limited per visitor IP (and overall), so nobody can
--    flood the list with fake signups or test thousands of emails.
--  * A repeat email no longer gets back that person's real pass number.
--  * p_photo must be a <uuid>.jpg that really exists in the faces bucket,
--    so nobody can attach another file or someone else's photo.
--  * list_wall returns only the first word of the name (the page only shows
--    that anyway), not the full name.

begin;

------------------------------------------------------------------------------
-- Rate limit for signups
------------------------------------------------------------------------------
create table if not exists public.signup_attempts (
  id  bigint generated always as identity primary key,
  ip  text        not null,
  at  timestamptz not null default now()
);
create index if not exists signup_attempts_at_idx on public.signup_attempts (at);
alter table public.signup_attempts enable row level security;   -- no policies
revoke all on public.signup_attempts from anon, authenticated;

create or replace function public.signup_guard()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text;
  per_ip int;
  overall int;
begin
  -- Visitor IP as seen by Supabase's API gateway (first hop of x-forwarded-for).
  v_ip := coalesce(
    nullif(trim(split_part(
      coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''),
      ',', 1)), ''),
    'unknown');

  delete from signup_attempts where at < now() - interval '1 day';

  select count(*) filter (where ip = v_ip), count(*)
    into per_ip, overall
  from signup_attempts
  where at > now() - interval '10 minutes';

  -- 8 per visitor per 10 min (a few retries / a friend on the same Wi-Fi),
  -- 600 overall per 10 min (well above a launch-day rush for one event).
  if per_ip >= 8 or overall >= 600 then
    raise exception 'too many signups, try again shortly' using errcode = 'P0429';
  end if;

  insert into signup_attempts (ip) values (v_ip);
end $$;
revoke all on function public.signup_guard() from public, anon, authenticated;

------------------------------------------------------------------------------
-- join_list (same inputs and output shape as before)
------------------------------------------------------------------------------
create or replace function public.join_list(
  p_name text, p_email text,
  p_whatsapp text default null, p_instagram text default null, p_photo text default null)
returns table(pass_no integer, duplicate boolean)
language plpgsql
security definer
set search_path = public
as $function$
  declare
    v_email text := lower(trim(p_email));
    v_name text := trim(p_name);
    v_whatsapp text := nullif(trim(p_whatsapp), '');
    v_instagram text := nullif(trim(p_instagram), '');
    v_photo text := nullif(trim(p_photo), '');
  begin
    perform public.signup_guard();

    if v_name is null or length(v_name) < 1 or length(v_name) > 80 then
      raise exception 'invalid name';
    end if;

    if v_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' or length(v_email) > 120 then
      raise exception 'invalid email';
    end if;

    if v_whatsapp is not null and v_whatsapp !~ '^\+?[0-9]{7,15}$' then
      raise exception 'invalid whatsapp';
    end if;

    if v_instagram is not null and length(v_instagram) > 60 then
      raise exception 'invalid instagram';
    end if;

    -- Photo: only a fresh upload made by the form (<uuid>.jpg in `faces`),
    -- and only one that isn't already attached to another signup.
    -- Anything else is dropped rather than failing the signup.
    if v_photo is not null and (
         v_photo !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
         or not exists (select 1 from storage.objects o
                        where o.bucket_id = 'faces' and o.name = v_photo)
         or exists (select 1 from public.rsvps r where r.photo_path = v_photo)
       ) then
      v_photo := null;
    end if;

    -- Already on the list: say so, but don't hand back that person's pass number.
    if exists (select 1 from public.rsvps r where r.email = v_email) then
      return query select null::integer, true;
      return;
    end if;

    return query
    insert into public.rsvps (first_name, email, whatsapp, instagram, photo_path)
    values (v_name, v_email, v_whatsapp, v_instagram, v_photo)
    returning rsvps.pass_no, false;
  end;
$function$;

------------------------------------------------------------------------------
-- list_wall: first word of the name only
------------------------------------------------------------------------------
create or replace function public.list_wall()
returns table(first_name text, pass_no integer, photo_path text)
language sql
stable
security definer
set search_path = public
as $function$
    select split_part(trim(first_name), ' ', 1), pass_no, photo_path
    from public.rsvps
    where show_on_wall and photo_path is not null
    order by created_at desc
    limit 24;
$function$;

commit;
