-- Sprout database setup. Supabase dashboard > SQL Editor > New query > paste > Run.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  total_min int not null default 0,
  streak int not null default 0,
  best_streak int not null default 0,
  plants int not null default 0,
  shelf jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- Private data (tasks, sessions, settings). Only the owner can ever read it.
create table public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

create table public.friendships (
  id bigint generated always as identity primary key,
  requester uuid not null references public.profiles(id) on delete cascade,
  addressee uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  unique (requester, addressee),
  check (requester <> addressee)
);

alter table public.profiles enable row level security;
alter table public.user_data enable row level security;
alter table public.friendships enable row level security;

-- Profiles hold only public info (username, stats, plant shelf).
create policy "profiles readable by signed-in users" on public.profiles
  for select to authenticated using (true);
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "owner only" on public.user_data
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "see own friendships" on public.friendships
  for select to authenticated using (auth.uid() in (requester, addressee));
create policy "send request" on public.friendships
  for insert to authenticated with check (requester = auth.uid() and status = 'pending');
create policy "accept request" on public.friendships
  for update to authenticated using (addressee = auth.uid()) with check (addressee = auth.uid());
create policy "remove friendship" on public.friendships
  for delete to authenticated using (auth.uid() in (requester, addressee));

-- Create the profile automatically when someone registers.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, lower(new.raw_user_meta_data->>'username'));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== Sprout Plus (run this block too; if you already ran everything above, run only this) =====
-- Subscription status. Users can READ their own row, but only the server (service role) can write it,
-- so nobody can give themselves Plus from the browser.
create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  status text not null default 'inactive',
  current_period_end timestamptz
);
alter table public.subscriptions enable row level security;
create policy "read own subscription" on public.subscriptions
  for select to authenticated using (user_id = auth.uid());
