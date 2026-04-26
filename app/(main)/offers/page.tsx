"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { createNotification } from "@/lib/helpers/notifications";
import { dbProfileToUser } from "@/lib/types";
import type { User } from "@/lib/types";
import { UserAvatar } from "@/components/user/UserAvatar";
import { timeAgo, truncate } from "@/lib/helpers/format";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  ArrowLeftRight,
  MessageSquareQuote,
  Clock,
  Check,
  X,
  Loader2,
  Lock,
} from "lucide-react";
import Link from "next/link";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Pending" },
  accepted: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Accepted" },
  declined: { bg: "bg-red-500/10", text: "text-red-400", label: "Declined" },
  countered: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Countered" },
};

interface OfferRow {
  id: string;
  listing_id: string;
  buyer_id: string;
  offer_amount: number;
  trade_description: string | null;
  status: string;
  message: string;
  created_at: string;
  listings: { id: string; title: string; user_id: string } | null;
}

export default function OffersPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);

    const { data: rows } = await supabase
      .from("offers")
      .select("*, listings!inner(id, title, user_id)")
      .order("created_at", { ascending: false });

    const offerList = (rows ?? []) as OfferRow[];
    setOffers(offerList);

    // Fetch profiles for all other users
    const otherIds = new Set<string>();
    for (const o of offerList) {
      if (o.buyer_id !== currentUser.id) otherIds.add(o.buyer_id);
      if (o.listings && o.listings.user_id !== currentUser.id) otherIds.add(o.listings.user_id);
    }
    if (otherIds.size > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("*")
        .in("id", [...otherIds]);
      if (profileRows) {
        const map = new Map<string, User>();
        for (const p of profileRows) {
          const u = dbProfileToUser(p);
          map.set(u.id, u);
        }
        setProfiles(map);
      }
    }

    setLoading(false);
  }, [currentUser, supabase]);

  useEffect(() => {
    if (currentUser) loadOffers();
  }, [currentUser, loadOffers]);

  // Poll every 5s
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(loadOffers, 5000);
    return () => clearInterval(interval);
  }, [currentUser, loadOffers]);

  async function handleUpdateOffer(offerId: string, newStatus: "accepted" | "declined", offer: OfferRow) {
    setUpdatingId(offerId);
    const { error } = await supabase
      .from("offers")
      .update({ status: newStatus })
      .eq("id", offerId);

    if (error) {
      toast.error("Failed to update offer");
      setUpdatingId(null);
      return;
    }

    // Notify the buyer
    const listing = offer.listings;
    await createNotification({
      supabase,
      userId: offer.buyer_id,
      type: newStatus === "accepted" ? "offer_accepted" : "offer_declined",
      icon: newStatus === "accepted" ? "check" : "x",
      title: `Offer ${newStatus}`,
      body: listing ? `Your offer on "${listing.title}" was ${newStatus}` : `Your offer was ${newStatus}`,
      link: "/offers",
    });

    toast.success(`Offer ${newStatus}`);
    setUpdatingId(null);
    loadOffers();
  }

  if (authLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in">
        <div className="flex justify-center mb-4"><Lock className="h-12 w-12 text-muted" /></div>
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
          Sign in to view your offers
        </h1>
        <p className="text-muted text-sm mb-6">
          You need to be logged in to see your offers.
        </p>
        <Link
          href="/login"
          className="inline-block bg-brand text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const receivedOffers = offers.filter((o) => o.listings?.user_id === currentUser.id);
  const sentOffers = offers.filter((o) => o.buyer_id === currentUser.id);
  const displayedOffers = activeTab === "received" ? receivedOffers : sentOffers;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground mb-6">
        My Offers
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab("received")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "received"
              ? "bg-brand text-white"
              : "bg-surface2 text-muted border border-border hover:border-brand/30"
          }`}
        >
          <ArrowDownLeft className="h-4 w-4" />
          Received ({receivedOffers.length})
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "sent"
              ? "bg-brand text-white"
              : "bg-surface2 text-muted border border-border hover:border-brand/30"
          }`}
        >
          <ArrowUpRight className="h-4 w-4" />
          Sent ({sentOffers.length})
        </button>
      </div>

      {/* Offers List */}
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
        </div>
      ) : displayedOffers.length === 0 ? (
        <EmptyState
          message={
            activeTab === "received"
              ? "No offers received yet"
              : "You haven't sent any offers yet"
          }
          icon="Mailbox"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {displayedOffers.map((offer) => {
            const listing = offer.listings;
            const otherId = activeTab === "received" ? offer.buyer_id : listing?.user_id;
            const otherUser = otherId ? profiles.get(otherId) ?? null : null;
            const status = STATUS_STYLES[offer.status] ?? STATUS_STYLES.pending;

            return (
              <div
                key={offer.id}
                className="bg-card border border-border rounded-[var(--radius-md)] p-4 sm:p-5"
              >
                <div className="flex items-start gap-4">
                  <UserAvatar user={otherUser} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-heading font-semibold text-sm text-foreground">
                        {otherUser?.displayName || "Unknown User"}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    {listing && (
                      <Link
                        href={`/listing/${listing.id}`}
                        className="text-xs text-brand hover:underline"
                      >
                        {truncate(listing.title, 60)}
                      </Link>
                    )}

                    <div className="flex flex-col gap-1 mt-2">
                      {offer.trade_description && (
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <ArrowLeftRight className="h-3.5 w-3.5 text-muted" />
                          <span>{truncate(offer.trade_description, 80)}</span>
                        </div>
                      )}
                      {offer.offer_amount > 0 && (
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <DollarSign className="h-3.5 w-3.5 text-muted" />
                          <span className="font-semibold">
                            ${offer.offer_amount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {offer.message && (
                      <div className="flex items-start gap-1.5 mt-2">
                        <MessageSquareQuote className="h-3.5 w-3.5 text-subtle mt-0.5 shrink-0" />
                        <p className="text-xs text-muted italic leading-relaxed">
                          &ldquo;{truncate(offer.message, 100)}&rdquo;
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="h-3 w-3 text-subtle" />
                      <span className="text-xs text-subtle">
                        {timeAgo(offer.created_at)}
                      </span>
                    </div>

                    {/* Accept/Decline buttons for received pending offers */}
                    {activeTab === "received" && offer.status === "pending" && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleUpdateOffer(offer.id, "accepted", offer)}
                          disabled={updatingId === offer.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                        >
                          {updatingId === offer.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateOffer(offer.id, "declined", offer)}
                          disabled={updatingId === offer.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          {updatingId === offer.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
