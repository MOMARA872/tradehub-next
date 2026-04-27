-- supabase/migrations/005_messages_read_policy.sql
--
-- Allow thread participants to mark received messages as read.
-- The WITH CHECK constraint ensures the only allowed mutation is
-- setting is_read = true — no other column can be changed via this policy.

create policy "Recipients can mark messages as read"
  on messages for update using (
    auth.uid() in (
      select buyer_id from threads where id = thread_id
      union
      select seller_id from threads where id = thread_id
    )
  )
  with check (is_read = true);
