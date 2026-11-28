-- The Supabase stand-in (Rhema supabase/tests/local_shim.sql) keeps only id
-- and email for sign in accounts; the made up data also fills aud and role.
alter table auth.users add column if not exists aud text, add column if not exists role text;
