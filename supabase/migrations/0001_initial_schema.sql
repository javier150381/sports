create extension if not exists "pgcrypto";

create type public.user_role as enum ('VISITOR', 'FAN', 'EDITOR', 'ADMIN');
create type public.context_type as enum ('TEAM', 'COMPETITION', 'SPECIAL_EVENT');
create type public.shirt_status as enum ('AVAILABLE', 'ACTIVATED', 'BLOCKED');
create type public.fixture_status as enum ('PRE_MATCH', 'LIVE', 'POST_MATCH', 'POSTPONED', 'CANCELLED');
create type public.content_type as enum ('NEWS', 'VIDEO', 'GOAL_VIDEO', 'HIGHLIGHT', 'MEME', 'IMAGE', 'PROMOTION', 'LIVE_STREAM', 'WALLPAPER', 'ANNOUNCEMENT');
create type public.content_status as enum ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');
create type public.poll_status as enum ('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED');
create type public.coupon_status as enum ('AVAILABLE', 'REDEEMED', 'EXPIRED', 'CANCELLED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  favorite_team_id uuid,
  role public.user_role not null default 'FAN',
  points integer not null default 0 check (points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_name text,
  description text,
  logo_url text,
  primary_color text,
  secondary_color text,
  external_api_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_favorite_team_id_fkey foreign key (favorite_team_id) references public.teams(id) on delete set null;

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  external_api_id text,
  season text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.special_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  banner_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  context_type public.context_type not null,
  team_id uuid references public.teams(id) on delete restrict,
  competition_id uuid references public.competitions(id) on delete restrict,
  special_event_id uuid references public.special_events(id) on delete restrict,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collections_single_context check (
    num_nonnulls(team_id, competition_id, special_event_id) = 1
  ),
  constraint collections_context_matches_target check (
    (context_type = 'TEAM' and team_id is not null and competition_id is null and special_event_id is null)
    or (context_type = 'COMPETITION' and competition_id is not null and team_id is null and special_event_id is null)
    or (context_type = 'SPECIAL_EVENT' and special_event_id is not null and team_id is null and competition_id is null)
  )
);

create table public.shirts (
  id uuid primary key default gen_random_uuid(),
  nfc_code text not null unique,
  serial_number text not null unique,
  collection_id uuid not null references public.collections(id) on delete restrict,
  status public.shirt_status not null default 'AVAILABLE',
  activated_by uuid references public.profiles(id) on delete set null,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shirts_activation_state check (
    (status = 'ACTIVATED' and activated_by is not null and activated_at is not null)
    or (status <> 'ACTIVATED' and activated_by is null and activated_at is null)
  )
);

create table public.nfc_scans (
  id uuid primary key default gen_random_uuid(),
  shirt_id uuid not null references public.shirts(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  referrer text,
  user_agent_family text
);

create table public.fixtures (
  id uuid primary key default gen_random_uuid(),
  external_fixture_id text not null unique,
  competition_id uuid references public.competitions(id) on delete set null,
  special_event_id uuid references public.special_events(id) on delete set null,
  home_team_id uuid not null references public.teams(id) on delete restrict,
  away_team_id uuid not null references public.teams(id) on delete restrict,
  match_date timestamptz not null,
  venue text,
  status public.fixture_status not null default 'PRE_MATCH',
  minute integer,
  home_score integer,
  away_score integer,
  live_data jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  content_type public.content_type not null,
  external_url text,
  image_url text,
  alt_text text,
  team_id uuid references public.teams(id) on delete set null,
  competition_id uuid references public.competitions(id) on delete set null,
  special_event_id uuid references public.special_events(id) on delete set null,
  fixture_id uuid references public.fixtures(id) on delete set null,
  status public.content_status not null default 'DRAFT',
  is_featured boolean not null default false,
  nfc_exclusive boolean not null default false,
  display_order integer not null default 0,
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  team_id uuid references public.teams(id) on delete set null,
  competition_id uuid references public.competitions(id) on delete set null,
  special_event_id uuid references public.special_events(id) on delete set null,
  fixture_id uuid references public.fixtures(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.poll_status not null default 'DRAFT',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint polls_valid_window check (ends_at > starts_at)
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  display_order integer not null default 0
);

create table public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references public.fixtures(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  first_scorer text,
  points_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fixture_id, user_id)
);

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  code text,
  image_url text,
  team_id uuid references public.teams(id) on delete set null,
  competition_id uuid references public.competitions(id) on delete set null,
  special_event_id uuid references public.special_events(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  nfc_exclusive boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotions_valid_window check (ends_at > starts_at)
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  code text not null unique,
  status public.coupon_status not null default 'AVAILABLE',
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);
create index teams_slug_idx on public.teams(slug);
create index competitions_slug_idx on public.competitions(slug);
create index special_events_slug_idx on public.special_events(slug);
create index collections_context_idx on public.collections(context_type, team_id, competition_id, special_event_id);
create index shirts_nfc_code_idx on public.shirts(nfc_code);
create index shirts_activated_by_idx on public.shirts(activated_by);
create index nfc_scans_shirt_id_scanned_at_idx on public.nfc_scans(shirt_id, scanned_at desc);
create index fixtures_match_date_idx on public.fixtures(match_date);
create index fixtures_status_idx on public.fixtures(status);
create index fixtures_team_idx on public.fixtures(home_team_id, away_team_id);
create index content_posts_public_idx on public.content_posts(status, published_at, expires_at);
create index content_posts_context_idx on public.content_posts(team_id, competition_id, special_event_id, fixture_id);
create index polls_status_window_idx on public.polls(status, starts_at, ends_at);
create index predictions_user_idx on public.predictions(user_id);
create index promotions_window_idx on public.promotions(active, starts_at, ends_at);
create index coupons_user_idx on public.coupons(user_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger teams_set_updated_at before update on public.teams for each row execute function public.set_updated_at();
create trigger competitions_set_updated_at before update on public.competitions for each row execute function public.set_updated_at();
create trigger special_events_set_updated_at before update on public.special_events for each row execute function public.set_updated_at();
create trigger collections_set_updated_at before update on public.collections for each row execute function public.set_updated_at();
create trigger shirts_set_updated_at before update on public.shirts for each row execute function public.set_updated_at();
create trigger fixtures_set_updated_at before update on public.fixtures for each row execute function public.set_updated_at();
create trigger content_posts_set_updated_at before update on public.content_posts for each row execute function public.set_updated_at();
create trigger predictions_set_updated_at before update on public.predictions for each row execute function public.set_updated_at();
create trigger promotions_set_updated_at before update on public.promotions for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'VISITOR'::public.user_role);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'ADMIN';
$$;

create or replace function public.is_editor_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('EDITOR', 'ADMIN');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    'FAN'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.competitions enable row level security;
alter table public.special_events enable row level security;
alter table public.collections enable row level security;
alter table public.shirts enable row level security;
alter table public.nfc_scans enable row level security;
alter table public.fixtures enable row level security;
alter table public.content_posts enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.predictions enable row level security;
alter table public.promotions enable row level security;
alter table public.coupons enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own_non_role" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "teams_public_read_active" on public.teams
  for select using (active = true or public.is_editor_or_admin());

create policy "teams_admin_all" on public.teams
  for all using (public.is_admin()) with check (public.is_admin());

create policy "competitions_public_read_active" on public.competitions
  for select using (active = true or public.is_editor_or_admin());

create policy "competitions_admin_all" on public.competitions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "special_events_public_read_active" on public.special_events
  for select using (active = true or public.is_editor_or_admin());

create policy "special_events_admin_all" on public.special_events
  for all using (public.is_admin()) with check (public.is_admin());

create policy "collections_public_read_active" on public.collections
  for select using (active = true or public.is_editor_or_admin());

create policy "collections_admin_all" on public.collections
  for all using (public.is_admin()) with check (public.is_admin());

create policy "shirts_select_activated_owner_or_admin" on public.shirts
  for select using (activated_by = auth.uid() or public.is_admin());

create policy "shirts_admin_all" on public.shirts
  for all using (public.is_admin()) with check (public.is_admin());

create policy "nfc_scans_admin_read" on public.nfc_scans
  for select using (public.is_admin());

create policy "nfc_scans_service_insert" on public.nfc_scans
  for insert with check (public.is_admin());

create policy "fixtures_public_read" on public.fixtures
  for select using (true);

create policy "fixtures_admin_all" on public.fixtures
  for all using (public.is_admin()) with check (public.is_admin());

create policy "content_public_read_published" on public.content_posts
  for select using (
    status = 'PUBLISHED'
    and published_at <= now()
    and (expires_at is null or expires_at > now())
  );

create policy "content_editor_admin_all" on public.content_posts
  for all using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());

create policy "polls_public_read_open" on public.polls
  for select using (status in ('OPEN', 'CLOSED') or public.is_editor_or_admin());

create policy "polls_editor_admin_all" on public.polls
  for all using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());

create policy "poll_options_public_read" on public.poll_options
  for select using (
    exists (
      select 1 from public.polls p
      where p.id = poll_id and (p.status in ('OPEN', 'CLOSED') or public.is_editor_or_admin())
    )
  );

create policy "poll_options_editor_admin_all" on public.poll_options
  for all using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());

create policy "poll_votes_select_own_or_admin" on public.poll_votes
  for select using (user_id = auth.uid() or public.is_editor_or_admin());

create policy "poll_votes_insert_own_open_poll" on public.poll_votes
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.polls p
      where p.id = poll_id and p.status = 'OPEN' and now() between p.starts_at and p.ends_at
    )
  );

create policy "predictions_select_own_or_admin" on public.predictions
  for select using (user_id = auth.uid() or public.is_editor_or_admin());

create policy "predictions_insert_own_before_match" on public.predictions
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.fixtures f
      where f.id = fixture_id and f.match_date > now()
    )
  );

create policy "predictions_update_own_before_match" on public.predictions
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.fixtures f
      where f.id = fixture_id and f.match_date > now()
    )
  );

create policy "promotions_public_read_active" on public.promotions
  for select using (
    active = true and now() between starts_at and ends_at
  );

create policy "promotions_editor_admin_all" on public.promotions
  for all using (public.is_editor_or_admin()) with check (public.is_editor_or_admin());

create policy "coupons_select_own_or_admin" on public.coupons
  for select using (user_id = auth.uid() or public.is_admin());

create policy "coupons_admin_all" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());
