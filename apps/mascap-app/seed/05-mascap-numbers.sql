-- MASCAP's own patient numbers in the demo (MCP-000001), not Rhema's RMC-.
-- Runs before any made up patient is added.
create or replace function private.next_patient_number()
returns text
language sql
volatile
security definer
set search_path = ''
as $$
  select 'MCP-' || lpad(nextval('private.patient_number_seq')::text, 6, '0');
$$;
