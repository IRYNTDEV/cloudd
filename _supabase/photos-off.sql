-- CLOUDD: switch the photo feature off in the database (2026-11-24)
-- Matches CONFIG.photos = false on the site. Nothing is deleted:
-- every stored photo stays in the `faces` bucket and in rsvps.photo_path.
-- Paste the WHOLE file into the Supabase SQL editor and click Run once.
-- One transaction: if anything fails, nothing changes.

begin;

-- 1. Nobody can upload to `faces` any more.
--    Drops every INSERT/ALL policy on storage.objects that mentions `faces`
--    and applies to anon/public/authenticated, and prints each one it drops.
do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and cmd in ('INSERT','ALL')
      and (coalesce(qual,'') || coalesce(with_check,'')) ilike '%faces%'
      and (roles && array['anon','public','authenticated']::name[])
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
    raise notice 'dropped upload policy: %', p.policyname;
  end loop;
end $$;

-- 2. Stored photos stop being publicly viewable (links like
--    .../storage/v1/object/public/faces/<file> return an error).
--    The photos themselves are kept.
update storage.buckets set public = false where id = 'faces';

-- 3. The wall can't be loaded through the API (the site already doesn't).
revoke execute on function public.list_wall() from public, anon, authenticated;

-- 4. Signups can't attach a photo. Same as part 3's join_list, except the
--    photo check is replaced by always dropping the photo.
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

    -- photos are switched off: p_photo is ignored

    if exists (select 1 from public.rsvps r where r.email = v_email) then
      return query select null::integer, true;
      return;
    end if;

    return query
    insert into public.rsvps (first_name, email, whatsapp, instagram, photo_path)
    values (v_name, v_email, v_whatsapp, v_instagram, null)
    returning rsvps.pass_no, false;
  end;
$function$;

commit;


------------------------------------------------------------------------------
-- TO TURN PHOTOS BACK ON later (together with CONFIG.photos = true on the site):
--   update storage.buckets set public = true where id = 'faces';
--   grant execute on function public.list_wall() to anon, authenticated;
--   then re-run security-fixes-3.sql (restores the photo-checking join_list)
--   and section 1d of security-fixes.sql (the upload policy).
------------------------------------------------------------------------------
