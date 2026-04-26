-- Increase listing-photos bucket file size limit from default (5MB) to 50MB
-- to allow larger image uploads

update storage.buckets
set file_size_limit = 52428800  -- 50MB in bytes
where id = 'listing-photos';
