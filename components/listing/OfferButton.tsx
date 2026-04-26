"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/helpers/format";
import { createNotification } from "@/lib/helpers/notifications";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Crown, Check, Package, Loader2 } from "lucide-react";
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

interface MyListing {
  id: string;
  title: string;
  price: number;
  price_type: string;
}

export function OfferButton({ listing }: { listing: ListingSnippet }) {
  const supabase = createClient();
  const { currentUser, loading: authLoading } = useAuth();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [myListings, setMyListings] = useState<MyListing[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loadingListings, setLoadingListings] = useState(false);

  const isPro =
    currentUser?.tier === "pro" &&
    (currentUser?.subscriptionStatus === "active" ||
      currentUser?.subscriptionStatus === "trialing");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user's own listings for trade offers (skip for owners — dialog never renders)
  useEffect(() => {
    if (!currentUserId || currentUserId === listing.user_id) return;
    setLoadingListings(true);
    supabase
      .from("listings")
      .select("id, title, price, price_type")
      .eq("user_id", currentUserId)
      .eq("status", "active")
      .neq("id", listing.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMyListings(data ?? []);
        setLoadingListings(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

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

  function toggleItem(id: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSendOffer() {
    if (!currentUserId) return;

    const tradeItems = myListings
      .filter((l) => selectedItems.has(l.id))
      .map((l) => l.title);
    const tradeDescription =
      tradeItems.length > 0 ? `Trade: ${tradeItems.join(", ")}` : null;
    const cashAmount = isPro && offerAmount ? parseFloat(offerAmount) : 0;

    // Must have at least trade items or a positive cash amount (Pro only)
    if (tradeItems.length === 0 && !(cashAmount > 0)) return;

    const { error } = await supabase.from("offers").insert({
      listing_id: listing.id,
      buyer_id: currentUserId,
      offer_amount: cashAmount,
      trade_description: tradeDescription,
      message: offerMessage,
    });
    if (error) {
      toast.error("Failed to send offer");
      return;
    }

    // Build notification
    const parts: string[] = [];
    if (tradeItems.length > 0)
      parts.push(
        `${tradeItems.length} item${tradeItems.length > 1 ? "s" : ""}`
      );
    if (cashAmount > 0) parts.push(`$${cashAmount.toFixed(2)}`);

    await createNotification({
      supabase,
      userId: listing.user_id,
      type: "offer_received",
      icon: "DollarSign",
      title: `New offer: ${parts.join(" + ")}`,
      body: `Someone made an offer on "${listing.title}"`,
      link: "/offers",
    });

    toast.success("Offer sent!");
    window.location.reload();
  }

  const canSubmit =
    selectedItems.size > 0 || (isPro && parseFloat(offerAmount) > 0);

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
          <div className="space-y-4">
            {/* Trade items — available to everyone */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-2">
                Select items to trade
              </label>
              {loadingListings ? (
                <div className="text-xs text-muted py-4 text-center">
                  Loading your listings...
                </div>
              ) : myListings.length === 0 ? (
                <div className="bg-surface2 border border-border rounded-lg p-4 text-center">
                  <Package className="h-6 w-6 text-muted mx-auto mb-2" />
                  <p className="text-xs text-muted">
                    You don&apos;t have any active listings to trade.
                  </p>
                  <Link
                    href="/post-new"
                    className="text-xs text-brand font-medium hover:underline mt-1 inline-block"
                  >
                    Post a listing first
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {myListings.map((item) => {
                    const selected = selectedItems.has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors ${
                          selected
                            ? "bg-brand/10 border-brand text-foreground"
                            : "bg-surface2 border-border text-muted hover:border-brand/30"
                        }`}
                      >
                        <div
                          className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            selected
                              ? "bg-brand border-brand"
                              : "border-border"
                          }`}
                        >
                          {selected && (
                            <Check className="h-2.5 w-2.5 text-white" />
                          )}
                        </div>
                        <span className="text-sm font-medium truncate flex-1">
                          {item.title}
                        </span>
                        <span className="text-xs text-subtle shrink-0">
                          {formatPrice(
                            item.price,
                            item.price_type as
                              | "fixed"
                              | "free"
                              | "trade"
                              | "negotiable"
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cash offer — Pro only */}
            {authLoading ? (
              <div className="h-10 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted" />
              </div>
            ) : isPro ? (
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  <span className="inline-flex items-center gap-1">
                    Offer Amount ($)
                    <Crown className="h-3 w-3 text-brand" />
                  </span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder={`Asking: ${formatPrice(listing.price, listing.price_type as "fixed" | "free" | "trade" | "negotiable")}`}
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
                />
                {selectedItems.size > 0 && offerAmount && (
                  <p className="text-[10px] text-subtle mt-1">
                    Items + cash will be combined in your offer
                  </p>
                )}
              </div>
            ) : (
              <Link
                href="/premium"
                className="flex items-center gap-1.5 text-xs text-brand font-medium hover:underline"
              >
                <Crown className="h-3 w-3" />
                Upgrade to Pro to add cash offers
              </Link>
            )}

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Message (optional)
              </label>
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
              disabled={!canSubmit}
              className="flex-1 bg-brand text-white text-sm font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Send Offer
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
