-- Blog approval (the CTO's JurisAssist blog work order of 17 Nov 2026).
-- The latest decision per document, tied to the Sanity revision it was made at,
-- plus an append-only audit of every transition.

create table approval (
  object_type text not null,
  object_id   text not null,
  title       text not null default '',
  revision    text not null,
  state       text not null check (state in ('approved', 'rejected')),
  decided_by  text not null check (decided_by = lower(decided_by)),
  decided_at  timestamptz not null default now(),
  reason      text,
  primary key (object_type, object_id)
);
create index approval_state_idx on approval (state);

create table approval_audit (
  id          bigint generated always as identity primary key,
  object_type text not null,
  object_id   text not null,
  revision    text not null,
  from_state  text not null,
  to_state    text not null,
  actor       text not null check (actor = lower(actor)),
  at          timestamptz not null default now(),
  reason      text
);
create index approval_audit_object_idx on approval_audit (object_type, object_id, at);

create function approval_audit_append_only() returns trigger language plpgsql as $$
begin
  raise exception 'approval_audit is append-only: % is not allowed', tg_op;
end $$;

create trigger approval_audit_no_update_delete
  before update or delete on approval_audit
  for each row execute function approval_audit_append_only();

create trigger approval_audit_no_truncate
  before truncate on approval_audit
  for each statement execute function approval_audit_append_only();

-- Checkers: admins of this site who may approve. Changed by adding or deleting a row.
create table blog_checker (
  email      text primary key check (email = lower(email) and email = btrim(email) and email <> ''),
  note       text,
  created_at timestamptz not null default now()
);
