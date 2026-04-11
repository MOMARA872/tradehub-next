"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/helpers/format";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

interface ListingSnippet {
  id: string;
  user_id: string;
  title: string;
  price: number;
  price_type: string;
}

export function OfferButton({ listing }: { listing: ListingSnippet }) {
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOwner = currentUserId === listing.user_id;

  if (isOwner) {
    return (
      <Link
        href="/dashboard"
        className="w-full flex items-center justify-center gap-2 bg-surface2 text-foreground text-sm font-medium py-2.5 rounded-lg mb-3 hover:bg-surface3 transition-colors"
      >
        Edit Listing
      </Link>
    );
  }

  async function handleSendOffer() {
    if (!currentUserId || !offerAmount) return;
    await supabase.from("offers").insert({
      listing_id: listing.id,
      buyer_id: currentUserId,
      offer_amount: parseFloat(offerAmount),
      message: offerMessage,
    });
    window.location.reload();
  }

  return (
    <Dialog>
      <DialogTrigger className="w-full bg-brand text-white text-sm font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity mb-3">
        Make an Offer
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="bg-card border-border p-6 max-w-md">
          <DialogTitle className="font-heading font-bold text-lg text-foreground mb-1">
            Make an Offer
          </DialogTitle>
          <DialogDescription className="text-xs text-muted mb-4">
            for &ldquo;{listing.title}&rdquo;
          </DialogDescription>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Offer Amount ($)</label>
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder={`Asking: ${formatPrice(listing.price, listing.price_type as "fixed" | "free" | "trade" | "negotiable")}`}
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Message (optional)</label>
              <textarea
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                rows={3}
                placeholder="Add a message to the seller..."
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <DialogClose className="flex-1 border border-border text-foreground text-sm font-medium py-2 rounded-lg hover:bg-surface2 transition-colors">
              Cancel
            </DialogClose>
            <button
              onClick={handleSendOffer}
              className="flex-1 bg-brand text-white text-sm font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Send Offer
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
