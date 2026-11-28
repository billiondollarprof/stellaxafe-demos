-- From Rhema .github/workflows/testing-seed.yml (made up data only).

-- Once only: stop if the demo patients are already there.

begin;

-- ===== 1. Three made up staff (they can never sign in) =====
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-00000000de01', 'demo-doctor@test.rhema',  'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000de02', 'demo-desk@test.rhema',    'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000de03', 'demo-lab@test.rhema',     'authenticated', 'authenticated')
on conflict (id) do nothing;
insert into public.staff (id, full_name, email, role, room_id)
select v.id::uuid, v.name, v.email, v.role::public.staff_role, (select id from public.rooms where name = v.room)
from (values
  ('00000000-0000-0000-0000-00000000de01', 'Dr. Demo Adeyemi',   'demo-doctor@test.rhema', 'doctor',     'Consultant Room 1'),
  ('00000000-0000-0000-0000-00000000de02', 'Demo Desk',          'demo-desk@test.rhema',   'front_desk', 'Front Desk'),
  ('00000000-0000-0000-0000-00000000de03', 'Demo Lab Scientist', 'demo-lab@test.rhema',    'laboratory', 'Laboratory')
) as v(id, name, email, role, room)
on conflict (id) do nothing;

-- ===== 2. Twelve made up patients =====
insert into public.patients (full_name, date_of_birth, sex, category, phone, town, state,
                             next_of_kin_name, next_of_kin_relationship, next_of_kin_phone, created_by)
select v.name, v.born::date, v.sex::public.patient_sex, v.kind::public.patient_category, v.phone,
       'Sapele', 'Delta', v.kin, v.rel, v.kin_phone, '00000000-0000-0000-0000-00000000de02'
from (values
  ('Chinedu Okafor',     '1981-03-14', 'male',   'individual', '08035550801', 'Ngozi Okafor',    'Wife',    '08035550851'),
  ('Blessing Edewor',    '1994-07-02', 'female', 'antenatal',  '08035550802', 'Tega Edewor',     'Husband', '08035550852'),
  ('Oghenekaro Ufuoma',  '2016-11-20', 'male',   'family',     '08035550803', 'Ese Ufuoma',      'Mother',  '08035550853'),
  ('Funmilayo Adebayo',  '1959-01-30', 'female', 'individual', '08035550804', 'Tunde Adebayo',   'Son',     '08035550854'),
  ('Ibrahim Musa',       '1976-05-09', 'male',   'individual', '08035550805', 'Aisha Musa',      'Wife',    '08035550855'),
  ('Grace Ighodaro',     '1999-09-17', 'female', 'antenatal',  '08035550806', 'Osaro Ighodaro',  'Husband', '08035550856'),
  ('Emeka Nwankwo',      '1988-12-03', 'male',   'individual', '08035550807', 'Chioma Nwankwo',  'Sister',  '08035550857'),
  ('Efe Omoregie',       '2020-04-25', 'female', 'family',     '08035550808', 'Osas Omoregie',   'Father',  '08035550858'),
  ('Yetunde Bakare',     '1967-08-11', 'female', 'individual', '08035550809', 'Kunle Bakare',    'Husband', '08035550859'),
  ('Godwin Akpobire',    '1972-02-19', 'male',   'individual', '08035550810', 'Rita Akpobire',   'Wife',    '08035550860'),
  ('Amaka Eze',          '2003-06-06', 'female', 'individual', '08035550811', 'Obinna Eze',      'Brother', '08035550861'),
  ('Peter Oghenero',     '1945-10-28', 'male',   'individual', '08035550812', 'Mary Oghenero',   'Daughter','08035550862')
) as v(name, born, sex, kind, phone, kin, rel, kin_phone);

-- ===== 3. The queue =====
insert into public.queue_entries (patient_id, room_id, status, note, sent_by, called_at)
select p.id, r.id, v.status::public.queue_status, v.note, '00000000-0000-0000-0000-00000000de02',
       case when v.status = 'in_consultation' then now() - interval '5 minutes' end
from (values
  ('08035550801', 'Consultant Room 1', 'waiting',         'Headache for 3 days'),
  ('08035550804', 'Consultant Room 1', 'waiting',         'Blood pressure review'),
  ('08035550807', 'Consultant Room 1', 'waiting',         null),
  ('08035550805', 'Laboratory',        'waiting',         'Malaria test'),
  ('08035550810', 'Pharmacy',          'waiting',         'Collect drugs'),
  ('08035550802', 'Nursing Station 1', 'in_consultation', 'Antenatal check')
) as v(phone, room, status, note)
join public.patients p on p.phone = v.phone
join public.rooms r on r.name = v.room;

-- ===== 4. Lab requests, payments and one finished result =====
-- Two waiting for payment (the Front Desk sees them).
insert into public.lab_requests (patient_id, tests, note, requested_by, status)
select p.id, v.tests::text[], v.note, '00000000-0000-0000-0000-00000000de01', 'awaiting_payment'
from (values
  ('08035550801', '{"Full Blood Count","Malaria test"}', 'Fever and headache'),
  ('08035550807', '{"Urinalysis"}',                     null)
) as v(phone, tests, note)
join public.patients p on p.phone = v.phone;

-- Two paid, waiting for the test (the lab sees them).
with paid as (
  insert into public.payments (patient_id, amount, purpose, mode, description, received_by)
  select p.id, v.amount, 'lab_test', v.mode::public.payment_mode, 'Lab: ' || v.tests, '00000000-0000-0000-0000-00000000de02'
  from (values
    ('08035550805', 3500.00, 'cash',     'Malaria test'),
    ('08035550806', 6000.00, 'transfer', 'Blood sugar, Urinalysis')
  ) as v(phone, amount, mode, tests)
  join public.patients p on p.phone = v.phone
  returning id, patient_id, description
)
insert into public.lab_requests (patient_id, tests, requested_by, status, payment_id)
select paid.patient_id, string_to_array(substr(paid.description, 6), ', '),
       '00000000-0000-0000-0000-00000000de01', 'awaiting_test', paid.id
from paid;

-- One finished, with its results in the record.
with done as (
  insert into public.lab_requests (patient_id, tests, requested_by, status, completed_at, completed_by)
  select p.id, '{"Full Blood Count","Blood sugar"}', '00000000-0000-0000-0000-00000000de01',
         'completed', now() - interval '1 hour', '00000000-0000-0000-0000-00000000de03'
  from public.patients p where p.phone = '08035550804'
  returning id, patient_id
)
insert into public.lab_results (patient_id, request_id, test, result, recorded_by, recorded_at)
select done.patient_id, done.id, v.test, v.result, '00000000-0000-0000-0000-00000000de03', now() - interval '1 hour'
from done, (values
  ('Full Blood Count', E'PCV 36%\nWBC 6.2 x10^9/L\nPlatelets 240 x10^9/L'),
  ('Blood sugar',      'Fasting 5.4 mmol/L (normal)')
) as v(test, result);

commit;
