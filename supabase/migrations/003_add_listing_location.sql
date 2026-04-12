-- Add per-listing coordinates for Facebook Marketplace-style map.
-- See docs/superpowers/specs (if missing, see plan: purring-seeking-toast.md).

-- 1. Coordinate columns and confirmation flag.
alter table listings
  add column lat numeric(9,6),
  add column lng numeric(9,6),
  add column location_confirmed boolean not null default false;

-- 2. Partial index for viewport queries.
--    Map queries always filter status='active' and lat is not null,
--    so this is the smallest useful index.
create index idx_listings_location on listings (lat, lng)
  where status = 'active' and lat is not null;

-- 3. Backfill existing rows to city center + ~±2km jitter so they show up
--    on the map. Handles BOTH storage formats: region IDs like 'prescott-az'
--    (written by post-new/page.tsx) and region names like 'Prescott, AZ'
--    (older data).
update listings l
set
  lat = c.lat + ((random() - 0.5) * 0.04),
  lng = c.lng + ((random() - 0.5) * 0.04),
  location_confirmed = false
from (values
  ('prescott-az',  'Prescott, AZ',  34.5400::numeric, -112.4685::numeric),
  ('phoenix-az',   'Phoenix, AZ',   33.4484::numeric, -112.0740::numeric),
  ('tucson-az',    'Tucson, AZ',    32.2226::numeric, -110.9747::numeric),
  ('flagstaff-az', 'Flagstaff, AZ', 35.1983::numeric, -111.6513::numeric),
  ('sedona-az',    'Sedona, AZ',    34.8697::numeric, -111.7610::numeric)
) as c(city_id, city_name, lat, lng)
where (l.city = c.city_id or l.city = c.city_name)
  and l.lat is null;
