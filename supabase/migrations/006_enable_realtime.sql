-- supabase/migrations/005_enable_realtime.sql
-- Enable Supabase Realtime on messaging tables

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table threads;
