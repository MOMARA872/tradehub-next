"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Offer, User } from "@/lib/types";
import { UserAvatar } from "@/components/user/UserAvatar";
import { timeAgo, truncate } from "@/lib/helpers/format";
import { EmptyState } from "@/components/common/EmptyState";
import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  ArrowLeftRight,
  MessageSquareQuote,
  Clock,
} from "lucide-react";
import Link from "next/link";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Pending" },
  accepted: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Accepted" },
  declined: { bg: "bg-red-500/10", text: "text-red-400", label: "Declined" },
  countered: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Countered" },
};

export default function OffersPage() {
  const { currentUser, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in">
        <div className="text-5xl mb-4">🔒</div>
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

  // TODO: Replace with Supabase query
  const receivedOffers: Offer[] = [];
  const sentOffers: Offer[] = [];

  const displayedOffers = activeTab === "received" ? receivedOffers : sentOffers;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Page Header */}
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
      {displayedOffers.length === 0 ? (
        <EmptyState
          message={
            activeTab === "received"
              ? "No offers received yet"
              : "You haven't sent any offers yet"
          }
          icon="📭"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {displayedOffers.map((offer) => {
            const listing = null as ({ id: string; title: string; userId: string } | null);
            const otherUser = null as (User | null);
            const status = STATUS_STYLES[offer.status];

            return (
              <div
                key={offer.id}
                className="bg-card border border-border rounded-[var(--radius-md)] p-4 sm:p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <UserAvatar user={otherUser} size="md" />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top row: name + status */}
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

                    {/* Listing title */}
                    {listing && (
                      <Link
                        href={`/listing/${listing.id}`}
                        className="text-xs text-brand hover:underline"
                      >
                        {truncate(listing.title, 60)}
                      </Link>
                    )}

                    {/* Offer amount or trade */}
                    <div className="flex items-center gap-2 mt-2">
                      {offer.tradeDescription ? (
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <ArrowLeftRight className="h-3.5 w-3.5 text-muted" />
                          <span>{truncate(offer.tradeDescription, 80)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <DollarSign className="h-3.5 w-3.5 text-muted" />
                          <span className="font-semibold">
                            ${offer.offerAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Message quote */}
                    {offer.message && (
                      <div className="flex items-start gap-1.5 mt-2">
                        <MessageSquareQuote className="h-3.5 w-3.5 text-subtle mt-0.5 shrink-0" />
                        <p className="text-xs text-muted italic leading-relaxed">
                          &ldquo;{truncate(offer.message, 100)}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Time */}
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="h-3 w-3 text-subtle" />
                      <span className="text-xs text-subtle">
                        {timeAgo(offer.createdAt)}
                      </span>
                    </div>
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
