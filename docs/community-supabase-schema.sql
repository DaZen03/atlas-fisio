-- Esquema inicial para la comunidad. No crea credenciales de acceso.
-- Primero crea a Jhostyn y Gerardo mediante Supabase Auth; después sustituye
-- los UUID de ejemplo al promover sus perfiles desde una sesión administrativa.

create type public.community_role as enum ('member','moderator','admin');
create type public.profession_label as enum ('enthusiast','physiotherapy','medicine','sport_science','personal_training','education_research','other');
create type public.account_status as enum ('active','suspended');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  role public.community_role not null default 'member',
  profession public.profession_label not null default 'enthusiast',
  profession_verified boolean not null default false,
  status public.account_status not null default 'active',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "public profiles are readable"
on public.profiles for select using (true);

create or replace function public.is_community_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

revoke all on function public.is_community_admin() from public;
grant execute on function public.is_community_admin() to authenticated;

create policy "admins update community profiles"
on public.profiles for update to authenticated
using (public.is_community_admin())
with check (public.is_community_admin());

-- La edición del nombre o profesión propios debe realizarse mediante una RPC
-- separada que solo acepte esos campos. No se permite cambiar rol, estado ni
-- verificación profesional desde el cliente.

-- Ejecutar únicamente desde SQL Editor o una función con service_role,
-- después de reemplazar ambos UUID por los valores reales de auth.users.
-- insert into public.profiles (id,display_name,role,profession,status)
-- values
--   ('<UUID_REAL_JHOSTYN>','Jhostyn','admin','enthusiast','active'),
--   ('<UUID_REAL_GERARDO>','Gerardo','admin','enthusiast','active');
