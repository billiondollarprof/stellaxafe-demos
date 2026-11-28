-- =============================================================================
-- 40-demo-staff.sql: one made up person for each role in the MASCAP demo.
--
-- Why: request 262 (Anthony, 2026-11-27). The demo's sign in page lets a
-- visitor pick a role and go straight in. Each button signs in as one of
-- these people. Every PIN is 1234, shown on the screen.
--
-- Never: a real name, a real email or a real phone number.
-- =============================================================================
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000d0001', 'frontdesk@demo.mascap', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000d0002', 'doctor@demo.mascap',    'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000d0003', 'nurse@demo.mascap',     'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000d0004', 'matron@demo.mascap',    'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000d0005', 'lab@demo.mascap',       'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000d0006', 'pharmacy@demo.mascap',  'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000d0007', 'admin@demo.mascap',     'authenticated', 'authenticated')
on conflict (id) do nothing;

insert into public.staff (id, full_name, email, role, room_id)
select v.id::uuid, v.name, v.email, v.role::public.staff_role, (select id from public.rooms where name = v.room)
from (values
  ('00000000-0000-0000-0000-0000000d0001', 'Joy Okoro',          'frontdesk@demo.mascap', 'front_desk', 'Front Desk'),
  ('00000000-0000-0000-0000-0000000d0002', 'Dr. Tobi Ekpe',      'doctor@demo.mascap',    'doctor',     'Consultant Room 1'),
  ('00000000-0000-0000-0000-0000000d0003', 'Nurse Bisi Oghene',  'nurse@demo.mascap',     'nurse',      'Nursing Station 1'),
  ('00000000-0000-0000-0000-0000000d0004', 'Matron Grace Idowu', 'matron@demo.mascap',    'matron',     'Consultant Room 2'),
  ('00000000-0000-0000-0000-0000000d0005', 'Sam Ukpe',           'lab@demo.mascap',       'laboratory', 'Laboratory'),
  ('00000000-0000-0000-0000-0000000d0006', 'Ruth Akpan',         'pharmacy@demo.mascap',  'pharmacy',   'Pharmacy'),
  ('00000000-0000-0000-0000-0000000d0007', 'Admin Desk',         'admin@demo.mascap',     'admin',      'Admin Office')
) as v(id, name, email, role, room)
on conflict (id) do nothing;

-- Every demo person: PIN 1234, terms already agreed, so the first screen is Home.
update public.staff
set pin_hash = extensions.crypt('1234', extensions.gen_salt('bf')),
    pin_failed_attempts = 0,
    terms_agreed_at = now(),
    terms_version = '2026-11-08'
where email like '%@demo.mascap';
