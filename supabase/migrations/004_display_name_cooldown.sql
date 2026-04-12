-- Allow users to edit their display name, with a 60-day cooldown between changes.
-- NULL = never edited = first change is free.

alter table profiles
  add column last_display_name_edit_at timestamptz;

-- Server-side enforcement: a trigger is the only way to do conditional
-- column-level validation (RLS can't inspect which columns changed).
create or replace function enforce_display_name_cooldown()
returns trigger as $$
begin
  -- Only fire when display_name actually changes.
  if NEW.display_name is distinct from OLD.display_name then
    -- If last edit was within 60 days, reject.
    if OLD.last_display_name_edit_at is not null
       and OLD.last_display_name_edit_at > now() - interval '60 days' then
      raise exception 'Display name can only be changed once every 60 days. Next change available after %',
        (OLD.last_display_name_edit_at + interval '60 days')::date;
    end if;
    -- Stamp the edit time.
    NEW.last_display_name_edit_at := now();
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_display_name_cooldown
  before update on profiles
  for each row
  execute function enforce_display_name_cooldown();
