-- Source capture and one contact per email address.
-- Run in the Supabase SQL Editor BEFORE deploying the updated submit-form function
-- and BEFORE pushing the site. Safe to re-run.
--
-- 1. Source columns on quote_requests and brochure_requests (where the visitor came from).
-- 2. contacts: one row per email address across quote and brochure requests.
--    A repeat submission is a new enquiry row linked to the same contact.
--    Job applicants (job_applications) are never added to contacts.
-- 3. upsert_contact(): used by the submit-form function (service role only).
-- 4. Lock-down: the website's public key cannot read or write contacts or call upsert_contact.
-- 5. Backfill contacts from rows that already exist.
--
-- Retention: delete a contact only when ALL its linked rows are past their retention period
-- (quote: 12 months after last contact; brochure: 12 months after it was sent). The
-- contact_id foreign keys stop a contact being deleted while linked rows still exist.

begin;

-- 1. Source columns
alter table public.quote_requests
  add column if not exists landing_page text,
  add column if not exists referrer text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists submitted_from text;

alter table public.brochure_requests
  add column if not exists landing_page text,
  add column if not exists referrer text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists submitted_from text;

-- 2. Contacts (email stored lowercased and trimmed)
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  phone text,
  company text,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

create unique index if not exists contacts_email_lower_key on public.contacts (lower(email));

alter table public.quote_requests add column if not exists contact_id uuid references public.contacts(id);
alter table public.brochure_requests add column if not exists contact_id uuid references public.contacts(id);
create index if not exists quote_requests_contact_id_idx on public.quote_requests (contact_id);
create index if not exists brochure_requests_contact_id_idx on public.brochure_requests (contact_id);

-- 3. Find-or-create a contact by email. On a repeat, update last_seen_at and only overwrite
--    name, phone and company with non-empty values (never replace a stored value with a blank).
create or replace function public.upsert_contact(p_email text, p_name text, p_phone text, p_company text)
returns uuid
language sql
set search_path = public
as $$
  insert into public.contacts as c (email, name, phone, company)
  values (lower(btrim(p_email)), nullif(btrim(p_name), ''), nullif(btrim(p_phone), ''), nullif(btrim(p_company), ''))
  on conflict ((lower(email))) do update set
    last_seen_at = now(),
    name = coalesce(excluded.name, c.name),
    phone = coalesce(excluded.phone, c.phone),
    company = coalesce(excluded.company, c.company)
  returning c.id;
$$;

-- 4. Lock-down: RLS on with no policies, no table privileges and no function access for the website.
alter table public.contacts enable row level security;
revoke all on table public.contacts from anon, authenticated;
revoke all on function public.upsert_contact(text, text, text, text) from public, anon, authenticated;
grant execute on function public.upsert_contact(text, text, text, text) to service_role;

-- 5. Backfill: one contact per distinct email already in quote_requests or brochure_requests,
--    taking name, phone and company from the most recent quote row for that email, if any.
--    Then link the existing rows. Does nothing on empty tables.
insert into public.contacts (email, name, phone, company, first_seen_at, last_seen_at)
select e.email, q.name, q.phone, q.company, e.first_seen, e.last_seen
from (
  select lower(btrim(email)) as email, min(created_at) as first_seen, max(created_at) as last_seen
  from (
    select email, created_at from public.quote_requests
    union all
    select email, created_at from public.brochure_requests
  ) all_rows
  where email is not null and btrim(email) <> ''
  group by lower(btrim(email))
) e
left join lateral (
  select nullif(btrim(qr.name), '') as name, nullif(btrim(qr.phone), '') as phone, nullif(btrim(qr.company), '') as company
  from public.quote_requests qr
  where lower(btrim(qr.email)) = e.email
  order by qr.created_at desc
  limit 1
) q on true
on conflict ((lower(email))) do nothing;

update public.quote_requests r
set contact_id = c.id
from public.contacts c
where r.contact_id is null and lower(btrim(r.email)) = lower(c.email);

update public.brochure_requests r
set contact_id = c.id
from public.contacts c
where r.contact_id is null and lower(btrim(r.email)) = lower(c.email);

commit;
