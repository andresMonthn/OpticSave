-- Restore the user_account_workspace VIEW, ensure personal-account trigger exists,
-- and backfill missing personal accounts for existing users.

begin;

-- esta es basicamente SQL script para poder generar la vista vieew que retorna la base de datos de las cuentas autenticadas

-- 1) Drop any TABLE that shadows the intended VIEW
do $$
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'user_account_workspace' and c.relkind = 'r' -- table
  ) then
    execute 'drop table public.user_account_workspace cascade';
  end if;
end $$;

-- 2) Recreate the VIEW as per apps/web/supabase/schemas/15-account-views.sql
create or replace view public.user_account_workspace
  with (security_invoker = true) as
select
  accounts.id as id,
  accounts.name as name,
  accounts.picture_url as picture_url,
  (
    select status
    from public.subscriptions
    where account_id = accounts.id
    limit 1
  ) as subscription_status
from public.accounts
where primary_owner_user_id = (select auth.uid())
  and accounts.is_personal_account = true
limit 1;

grant select on public.user_account_workspace to authenticated, service_role;

-- 3) Ensure kit.setup_new_user trigger exists to auto-create personal accounts
-- Drop existing trigger if present and recreate deterministically
do $$
begin
  if exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created'
  ) then
    execute 'drop trigger on_auth_user_created on auth.users';
  end if;
end $$;

-- (Re)create function kit.setup_new_user used by the trigger
create or replace function kit.setup_new_user() returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  user_name text;
  picture_url text;
begin
  if new.raw_user_meta_data ->> 'name' is not null then
    user_name := new.raw_user_meta_data ->> 'name';
  end if;

  if user_name is null and new.email is not null then
    user_name := split_part(new.email, '@', 1);
  end if;

  if user_name is null then
    user_name := '';
  end if;

  if new.raw_user_meta_data ->> 'avatar_url' is not null then
    picture_url := new.raw_user_meta_data ->> 'avatar_url';
  else
    picture_url := null;
  end if;

  insert into public.accounts(
    id,
    primary_owner_user_id,
    name,
    is_personal_account,
    picture_url,
    email
  ) values (
    new.id,
    new.id,
    user_name,
    true,
    picture_url,
    new.email
  );

  return new;
end;
$$;

-- Recreate the trigger
create trigger on_auth_user_created
after insert on auth.users for each row
execute procedure kit.setup_new_user();

-- 4) Backfill: create missing personal accounts for existing users
insert into public.accounts (id, primary_owner_user_id, name, is_personal_account, email)
select
  u.id,
  u.id,
  coalesce(u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1), ''),
  true,
  u.email
from auth.users u
left join public.accounts a
  on a.primary_owner_user_id = u.id and a.is_personal_account = true
where a.id is null;

commit;