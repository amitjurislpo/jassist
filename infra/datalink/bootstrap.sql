-- ===========================================================================
-- The JurisAssistMe website's two databases on the group instance.
-- Run ONCE, BY HAND, as jcg_master, with psql. SAFE TO RUN TWICE: every step
-- looks first and acts only if there is something to do, and a second run
-- sets the same passwords again. Nothing here drops or deletes.
--
-- The group database is private (IamJCG D-94, 10 Nov 2026): no public address,
-- no rule open to the internet. Only the data link's Lambdas (infra/datalink)
-- connect to these databases, from inside the group VPC.
--
-- WHAT IT MAKES
--
--   role jassist_prod_owner      LOGIN   owns jassist_prod,    connects to it only
--   role jassist_preview_owner   LOGIN   owns jassist_preview, connects to it only
--   database jassist_prod        CONNECT for jassist_prod_owner    and nobody else
--   database jassist_preview     CONNECT for jassist_preview_owner and nobody else
--
-- JurisAssist's roles may not connect to lie, iamjcg, sita or the Academy's databases (checked below).
--
-- NO PASSWORD IS IN THIS FILE. They come in at run time as environment
-- variables JASSIST_PROD_PASSWORD and JASSIST_PREVIEW_PASSWORD (read with
-- \getenv, never on a command line). Each is set with format() and \gexec, so
-- the value is never echoed. Before sending it, the file refuses to go on
-- unless the server would not write the statement to its log.
--
-- HOW TO RUN IT: infra/datalink/README.md, "Making JurisAssist's databases"
-- (the SSM tunnel through iamjcg-service, the master password piped from
-- Secrets Manager for this one command).
--
-- THIS FILE IS FOR psql (\if, \getenv, \gset, \gexec). Do not wrap it in a
-- transaction: CREATE DATABASE cannot run inside one.
-- ===========================================================================

\set ON_ERROR_STOP 1
-- A refusal below raises an error, so psql stops there and exits non-zero.
-- Never echo a statement this file sends, whatever flags psql was started with.
\set ECHO none
\set ECHO_HIDDEN off


-- ---------------------------------------------------------------------------
-- 0 - REFUSE THE WRONG CONNECTION
-- ---------------------------------------------------------------------------
select current_user = 'jcg_master' as is_master \gset
\if :is_master
\else
  \echo 'REFUSED: run this as jcg_master, the instance master role.'
  do $$ begin raise exception 'jassist-bootstrap.sql refused - see the line above. Nothing after it ran.'; end $$;
\endif


-- ---------------------------------------------------------------------------
-- 1 - THE TWO PASSWORDS, AND A SERVER THAT WILL NOT LOG THEM
-- ---------------------------------------------------------------------------
\if :{?prod_password}
\else
  \getenv prod_password JASSIST_PROD_PASSWORD
\endif
\if :{?preview_password}
\else
  \getenv preview_password JASSIST_PREVIEW_PASSWORD
\endif

\if :{?prod_password}
\else
  \echo 'REFUSED: no password for jassist_prod_owner. Set JASSIST_PROD_PASSWORD, or pass -v prod_password=...'
  do $$ begin raise exception 'jassist-bootstrap.sql refused - see the line above. Nothing after it ran.'; end $$;
\endif
\if :{?preview_password}
\else
  \echo 'REFUSED: no password for jassist_preview_owner. Set JASSIST_PREVIEW_PASSWORD, or pass -v preview_password=...'
  do $$ begin raise exception 'jassist-bootstrap.sql refused - see the line above. Nothing after it ran.'; end $$;
\endif

-- Checked first, before any statement below carries a password value.
select current_setting('log_statement') = 'none'
   and current_setting('log_min_duration_statement') = '-1' as logs_quiet \gset
\if :logs_quiet
\else
  \echo 'REFUSED: this server would log the ALTER ROLE that carries a password'
  \echo '(log_statement is not none, or log_min_duration_statement is not -1). Nothing was changed.'
  do $$ begin raise exception 'jassist-bootstrap.sql refused - see the line above. Nothing after it ran.'; end $$;
\endif

-- Strong means long: at least 32 characters each, and the two must differ.
-- The values are compared on the server and only true or false comes back.
select length(:'prod_password') >= 32
   and length(:'preview_password') >= 32
   and :'prod_password' <> :'preview_password' as passwords_ok \gset
\if :passwords_ok
\else
  \echo 'REFUSED: each password must be at least 32 characters, and the two must differ.'
  do $$ begin raise exception 'jassist-bootstrap.sql refused - see the line above. Nothing after it ran.'; end $$;
\endif


-- ---------------------------------------------------------------------------
-- 2 - THE TWO ROLES
--
-- LOGIN, and nothing else - the same attributes bootstrap.sql gives every
-- role, stated rather than left to defaults. ALTER ROLE after CREATE puts back
-- the ones jcg_master may set on a second run. It leaves out NOSUPERUSER,
-- NOBYPASSRLS and NOREPLICATION: only a true superuser may name those in an
-- ALTER ROLE, and jcg_master is not one (RDS gives it rds_superuser). Section 5
-- prints all of them, so a change is seen.
--
-- CONNECTION LIMIT, because each data link Lambda copy holds one
-- connection, and this small instance (db.t4g.micro) has
-- about a hundred connections for IamJCG, SITA and LIE as well. A limit per
-- role means a busy JurisAssist site can fill its own share, never the instance.
-- 20 for production, 5 for previews. Change it with ALTER ROLE, here.
-- ---------------------------------------------------------------------------
select 'create role jassist_prod_owner login nosuperuser nocreatedb nocreaterole nobypassrls noreplication noinherit'
 where not exists (select 1 from pg_roles where rolname = 'jassist_prod_owner') \gexec
select 'create role jassist_preview_owner login nosuperuser nocreatedb nocreaterole nobypassrls noreplication noinherit'
 where not exists (select 1 from pg_roles where rolname = 'jassist_preview_owner') \gexec

alter role jassist_prod_owner    login nocreatedb nocreaterole noinherit connection limit 20;
alter role jassist_preview_owner login nocreatedb nocreaterole noinherit connection limit 5;

select format('alter role jassist_prod_owner password %L', :'prod_password') \gexec
select format('alter role jassist_preview_owner password %L', :'preview_password') \gexec
\unset prod_password
\unset preview_password


-- ---------------------------------------------------------------------------
-- 3 - THE TWO DATABASES, EACH TO ITS OWNER, OPEN TO ITS OWNER ONLY
--
-- The master role must be a member of an owner to hand it a database
-- (PostgreSQL 16 and later), as in bootstrap.sql section 3.
--
-- REVOKE FIRST, GRANT SECOND, for bootstrap.sql's reason: PostgreSQL grants
-- CONNECT on a new database to PUBLIC, that is to every role that exists now
-- or later - lead_opt_app, iamjcg_app and sita_app included.
-- ---------------------------------------------------------------------------
grant jassist_prod_owner, jassist_preview_owner to current_user;

select 'create database jassist_prod owner jassist_prod_owner'
 where not exists (select 1 from pg_database where datname = 'jassist_prod') \gexec
select 'create database jassist_preview owner jassist_preview_owner'
 where not exists (select 1 from pg_database where datname = 'jassist_preview') \gexec

alter database jassist_prod    owner to jassist_prod_owner;
alter database jassist_preview owner to jassist_preview_owner;

revoke connect on database jassist_prod    from public;
revoke connect on database jassist_preview from public;

grant connect on database jassist_prod    to jassist_prod_owner;
grant connect on database jassist_preview to jassist_preview_owner;

-- DELIBERATELY ABSENT: no JurisAssist role against another database, and no
-- other role against a JurisAssist database. Production and previews do not
-- share a role either, so a preview build's password opens no production data.


-- ---------------------------------------------------------------------------
-- 4 - THE EXISTING DATABASES STAY CLOSED TO JURISASSIST
--
-- bootstrap.sql already did this. Said again, only for a database that
-- exists, so that an instance where it was missed is closed now. A second
-- revoke of something already revoked changes nothing.
--
-- NOT TOUCHED: `postgres` and `template1`. PostgreSQL leaves CONNECT on both
-- open to PUBLIC, and bootstrap.sql did not close them, because its rule names
-- lie, iamjcg, sita and the Academy's databases. They hold no application data. Section 5 prints
-- whether JurisAssist's roles can connect to them, so it is seen, not assumed.
-- ---------------------------------------------------------------------------
select format('revoke connect on database %I from public', datname)
  from pg_database where datname in ('lie', 'iamjcg', 'sita', 'academy_prod', 'academy_preview') order by datname \gexec

-- And proved: if either JurisAssist role can still connect to lie, iamjcg, sita or the Academy's databases,
-- stop here, loudly. On RDS jcg_master revokes as a member of each owner
-- (bootstrap.sql section 3 made it one); where it is not, its REVOKE above only
-- warns "no privileges could be revoked", which is easy to scroll past.
select not exists (
  select 1
    from (values ('jassist_prod_owner'), ('jassist_preview_owner')) as r(rolname)
   cross join pg_database d
   where d.datname in ('lie', 'iamjcg', 'sita', 'academy_prod', 'academy_preview')
     and has_database_privilege(r.rolname, d.datname, 'CONNECT')
) as others_closed \gset
\if :others_closed
\else
  \echo 'FAILED: a JurisAssist role can still connect to lie, iamjcg, sita or academy_prod, academy_preview. Their owner must revoke CONNECT from PUBLIC (bootstrap.sql section 3).'
  do $$ begin raise exception 'jassist-bootstrap.sql refused - see the line above. Nothing after it ran.'; end $$;
\endif


-- ---------------------------------------------------------------------------
-- 5 - VERIFY, rather than assume. Read it.
--
-- What it must show: each JurisAssist database owned by its owner, with no `=Tc/`
-- (PUBLIC) entry; and, per pair, true only for a JurisAssist role against its own
-- database (and `postgres` / `template1`, see section 4).
-- ---------------------------------------------------------------------------
select datname, pg_get_userbyid(datdba) as owner, datacl
  from pg_database
 where datname in ('jassist_prod', 'jassist_preview', 'lie', 'iamjcg', 'sita', 'academy_prod', 'academy_preview')
 order by datname;

select rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolbypassrls, rolreplication, rolconnlimit
  from pg_roles
 where rolname in ('jassist_prod_owner', 'jassist_preview_owner')
 order by rolname;

select r.rolname, d.datname,
       has_database_privilege(r.rolname, d.datname, 'CONNECT') as can_connect
  from (values ('jassist_prod_owner'), ('jassist_preview_owner')) as r(rolname)
 cross join pg_database d
 where d.datallowconn
 order by r.rolname, d.datname;
