-- Home opens clean in the demo: no announcement waiting (Anthony,
-- 2026-11-28: "isn't it really necessary to show an announcement?").
-- The Announce screen still works for the visitor to try.
delete from public.announcement_reads;
delete from public.announcements;
