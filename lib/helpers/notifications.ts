import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationType } from "@/lib/types";

interface CreateNotificationParams {
  supabase: SupabaseClient;
  userId: string;
  type: NotificationType;
  icon: string;
  title: string;
  body?: string;
  link: string;
}

export async function createNotification({
  supabase,
  userId,
  type,
  icon,
  title,
  body = "",
  link,
}: CreateNotificationParams) {
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    icon,
    title,
    body,
    link,
  });
}
