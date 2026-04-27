"use server";

import { createClient } from "@/lib/supabase/server";

// Cash-offer Accept/Decline used to call `supabase.from("offers").update(...)`
// directly. Migration 015 dropped the participant UPDATE policy on offers —
// all status changes must flow through the SECURITY DEFINER stored functions.
// These actions wrap the relevant RPCs so the existing client UI keeps working.
//
// The RPCs handle their own notification fan-out (trade_offer_accepted /
// trade_offer_passed), so callers must not insert a duplicate notification.

export async function acceptOfferAction(
  offerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const { error } = await supabase.rpc("accept_offer", { p_offer_id: offerId });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

export async function passOfferAction(
  offerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const { error } = await supabase.rpc("pass_offer", { p_offer_id: offerId });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
