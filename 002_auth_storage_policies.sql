-- =========================================================
-- 1) AUTH + helpers de autorización
-- =========================================================

-- Devuelve el rol del usuario autenticado
create or replace function public.get_my_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid());
$$;

revoke all on function public.get_my_role() from public;
grant execute on function public.get_my_role() to authenticated;

-- Valida si el usuario autenticado es dueño de la cafetería
create or replace function public.is_cafeteria_owner(_cafeteria_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cafeterias c
    where c.id = _cafeteria_id
      and c.owner_id = (select auth.uid())
  );
$$;

revoke all on function public.is_cafeteria_owner(uuid) from public;
grant execute on function public.is_cafeteria_owner(uuid) to authenticated;

-- Trigger de alta de perfil al crear usuario en auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    'estudiante'::public.user_role
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- =========================================================
-- 2) STORAGE buckets
-- =========================================================

insert into storage.buckets (id, name, public)
values
  ('payment-proofs', 'payment-proofs', false),
  ('rider-documents', 'rider-documents', false),
  ('cafeteria-assets', 'cafeteria-assets', true),
  ('product-images', 'product-images', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

alter table storage.objects enable row level security;


-- =========================================================
-- 3) STORAGE policies
-- =========================================================

-- Limpieza (para poder recrear)
drop policy if exists "storage_pp_insert" on storage.objects;
drop policy if exists "storage_pp_select_student" on storage.objects;
drop policy if exists "storage_pp_select_cafeteria" on storage.objects;
drop policy if exists "storage_pp_select_admin" on storage.objects;

drop policy if exists "storage_rd_insert" on storage.objects;
drop policy if exists "storage_rd_select_owner" on storage.objects;
drop policy if exists "storage_rd_select_admin" on storage.objects;

drop policy if exists "storage_ca_insert" on storage.objects;
drop policy if exists "storage_ca_update" on storage.objects;
drop policy if exists "storage_ca_select" on storage.objects;

drop policy if exists "storage_pi_insert" on storage.objects;
drop policy if exists "storage_pi_update" on storage.objects;
drop policy if exists "storage_pi_delete" on storage.objects;
drop policy if exists "storage_pi_select" on storage.objects;

-- payment-proofs
create policy "storage_pp_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = ((select auth.uid())::text)
);

create policy "storage_pp_select_student"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = ((select auth.uid())::text)
);

create policy "storage_pp_select_cafeteria"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'cafeteria'::public.user_role
  )
);

create policy "storage_pp_select_admin"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'::public.user_role
  )
);

-- rider-documents
create policy "storage_rd_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'rider-documents'
  and (storage.foldername(name))[1] = ((select auth.uid())::text)
);

create policy "storage_rd_select_owner"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'rider-documents'
  and (storage.foldername(name))[1] = ((select auth.uid())::text)
);

create policy "storage_rd_select_admin"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'rider-documents'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'::public.user_role
  )
);

-- cafeteria-assets
create policy "storage_ca_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cafeteria-assets'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = any (array['cafeteria'::public.user_role, 'admin'::public.user_role])
  )
);

create policy "storage_ca_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'cafeteria-assets'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = any (array['cafeteria'::public.user_role, 'admin'::public.user_role])
  )
)
with check (
  bucket_id = 'cafeteria-assets'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = any (array['cafeteria'::public.user_role, 'admin'::public.user_role])
  )
);

create policy "storage_ca_select"
on storage.objects
for select
to public
using (bucket_id = 'cafeteria-assets');

-- product-images
create policy "storage_pi_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = any (array['cafeteria'::public.user_role, 'admin'::public.user_role])
  )
);

create policy "storage_pi_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = any (array['cafeteria'::public.user_role, 'admin'::public.user_role])
  )
)
with check (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = any (array['cafeteria'::public.user_role, 'admin'::public.user_role])
  )
);

create policy "storage_pi_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = any (array['cafeteria'::public.user_role, 'admin'::public.user_role])
  )
);

create policy "storage_pi_select"
on storage.objects
for select
to public
using (bucket_id = 'product-images');