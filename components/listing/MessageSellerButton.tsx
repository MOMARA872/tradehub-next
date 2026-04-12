"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  listingId: string;
  sellerId: string;
  listingTitle: string;
}

export function MessageSellerButton({ listingId, sellerId, listingTitle }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, [supabase.auth]);

  const isOwnListing = currentUserId === sellerId;

  async function handleClick() {
    if (!currentUserId) {
      router.push("/login");
      return;
    }
    setLoading(true);

    try {
      // Check for existing thread
      const { data: existing } = await supabase
        .from("threads")
        .select("id")
        .eq("listing_id", listingId)
        .eq("buyer_id", currentUserId)
        .maybeSingle();

      if (existing) {
        router.push(`/messages?thread=${existing.id}`);
        return;
      }

      // Create new thread
      const { data: newThread, error } = await supabase
        .from("threads")
        .insert({
          listing_id: listingId,
          buyer_id: currentUserId,
          seller_id: sellerId,
          listing_title: listingTitle,
        })
        .select("id")
        .single();

      if (error || !newThread) {
        toast.error("Could not start conversation. Please try again.");
        return;
      }

      router.push(`/messages?thread=${newThread.id}`);
    } finally {
      setLoading(false);
    }
  }

  if (isOwnListing) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 border border-border text-muted text-sm font-medium py-2.5 rounded-lg opacity-50 cursor-not-allowed"
      >
        <MessageSquare className="h-4 w-4" />
        Your Listing
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 border border-border text-foreground text-sm font-medium py-2.5 rounded-lg hover:bg-surface2 transition-colors disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="h-4 w-4" />
      )}
      Message Seller
    </button>
  );
}
