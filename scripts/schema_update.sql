-- run in Supabase SQL editor, adds to existing sites/palettes tables

alter table sites add column if not exists description text;
alter table sites add column if not exists style text;
alter table sites add column if not exists primary_color_family text;
alter table sites add column if not exists likes integer default 0;
alter table sites add column if not exists last_updated date;
alter table sites add column if not exists quote text;

alter table palettes add column if not exists color_name text;

create table if not exists versions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites(id) on delete cascade,
  version text,
  version_date date,
  colors jsonb
);

alter table versions enable row level security;
create policy "public read versions" on versions for select using (true);

alter table sites add constraint sites_name_unique unique (name);