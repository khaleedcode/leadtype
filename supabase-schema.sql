-- Supabase Database Schema for Leadtype

-- 1. Create a table for user profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  avatar_url text
);

-- Turn on Row Level Security (RLS) for profiles
alter table public.profiles enable row level security;

-- Policy: Users can view all profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

-- Policy: Users can insert their own profile
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

-- Policy: Users can update their own profile
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. Create a table to store typing test results
create table public.test_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  wpm integer not null,
  accuracy numeric not null,
  mode text not null, -- 'time' or 'words'
  amount integer not null, -- 15, 30, 60 or 10, 25, 50
  correct_chars integer not null,
  incorrect_chars integer not null,
  test_time numeric not null
);

-- Turn on RLS for test results
alter table public.test_results enable row level security;

-- Policy: Users can view their own test results
create policy "Users can view own test results."
  on test_results for select
  using ( auth.uid() = user_id );

-- Policy: Users can insert their own test results
create policy "Users can insert own test results."
  on test_results for insert
  with check ( auth.uid() = user_id );

-- (Optional) Function to automatically create a profile when a new user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Trigger to call the function on new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
