-- supabase/migrations/007_add_zip_code.sql

alter table listings add column zip_code text not null default '';
