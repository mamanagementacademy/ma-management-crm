create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text default 'MA Management',
  created_at timestamp with time zone default now()
);

create table if not exists players (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  role text,
  club text,
  value numeric default 0,
  contract_end date,
  status text default 'Attivo',
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists deals (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  player text,
  club text,
  stage text default 'Interesse',
  value numeric default 0,
  commission numeric default 0,
  probability int default 0,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists clubs (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  club text not null,
  contact text,
  role text,
  phone text,
  email text,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists contracts (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  player text,
  type text,
  start_date date,
  end_date date,
  commission text,
  status text default 'Attivo',
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists deadlines (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  due_date date,
  type text,
  priority text default 'Media',
  status text default 'Aperta',
  created_at timestamp with time zone default now()
);

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  related text,
  type text,
  link text,
  notes text,
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;
alter table players enable row level security;
alter table deals enable row level security;
alter table clubs enable row level security;
alter table contracts enable row level security;
alter table deadlines enable row level security;
alter table documents enable row level security;

create policy "profiles own data" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "players own data" on players for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "deals own data" on deals for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "clubs own data" on clubs for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "contracts own data" on contracts for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "deadlines own data" on deadlines for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "documents own data" on documents for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
