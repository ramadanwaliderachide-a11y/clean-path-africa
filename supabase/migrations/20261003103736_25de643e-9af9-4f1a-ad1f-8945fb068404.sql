create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.profiles (
  id uuid primary key,
  full_name text not null default '',
  phone text,
  email text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.raw_user_meta_data->>'phone', new.email);
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  if lower(new.email) = 'ramadanwaliderachide@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  vehicle text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.drivers to authenticated;
grant all on public.drivers to service_role;
alter table public.drivers enable row level security;
create policy "admin drivers" on public.drivers for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  driver_id uuid references public.drivers(id) on delete set null,
  route_date date not null default current_date,
  status text not null default 'Planeada',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.routes to authenticated;
grant all on public.routes to service_role;
alter table public.routes enable row level security;
create policy "admin routes" on public.routes for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.pickups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  waste_type text not null,
  qty text not null,
  pickup_date date not null,
  pickup_time text not null,
  location text not null,
  lat double precision,
  lng double precision,
  notes text,
  status text not null default 'Pendente',
  value text not null default '250 MZN',
  route_id uuid references public.routes(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.pickups to authenticated;
grant all on public.pickups to service_role;
alter table public.pickups enable row level security;
create policy "own pickups read" on public.pickups for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own pickups insert" on public.pickups for insert to authenticated with check (user_id = auth.uid());
create policy "admin pickups update" on public.pickups for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin pickups delete" on public.pickups for delete to authenticated using (public.has_role(auth.uid(),'admin'));