"use client";

import { useAuth } from "@/hooks/useAuth";
import type { Listing, Offer } from "@/lib/types";
import { ListingCard } from "@/components/listing/ListingCard";
import {
  LayoutGrid,
  HandCoins,
  Star,
  ShieldCheck,
  PlusCircle,
  MessageSquare,
  Search,
  MapPin,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { currentUser, isLoggedIn } = useAuth();
  // TODO: Replace with Supabase queries
  const LISTINGS: Listing[] = [];
  const OFFERS: Offer[] = [];

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
          Sign in to view your dashboard
        </h1>
        <p className="text-muted text-sm mb-6">
          You need to be logged in to access your dashboard.
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

  const myListings = LISTINGS.filter((l) => l.userId === currentUser.id);
  const myOffers = OFFERS.filter((o) => o.buyerId === currentUser.id);
  const activeOffers = myOffers.filter((o) => o.status === "pending" || o.status === "countered");
  const myReviews: { revieweeId: string }[] = []; // TODO: Replace with Supabase query

  // Listings that got an auto-backfilled location from the 003 migration.
  // Inert until the LISTINGS query above is wired up to Supabase — once it is,
  // the banner will show automatically for users with unconfirmed listings.
  const unconfirmedLocations = myListings.filter(
    (l) => l.status === "active" && !l.locationConfirmed,
  );

  const stats = [
    {
      label: "My Listings",
      value: myListings.length,
      icon: LayoutGrid,
      color: "text-brand",
    },
    {
      label: "Active Offers",
      value: activeOffers.length,
      icon: HandCoins,
      color: "text-amber-500",
    },
    {
      label: "Reviews",
      value: myReviews.length,
      icon: Star,
      color: "text-yellow-500",
    },
    {
      label: "Trust Score",
      value: `${currentUser.trustScore}%`,
      icon: ShieldCheck,
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Confirm-location banner — renders when any of the user's listings
          have locationConfirmed === false (auto-backfilled by migration 003). */}
      {unconfirmedLocations.length > 0 && (
        <div className="mb-6 bg-brand/10 border border-brand/30 rounded-[var(--radius-md)] p-4 flex items-center gap-3">
          <MapPin className="h-5 w-5 text-brand shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {unconfirmedLocations.length === 1
                ? "1 of your listings needs location confirmation."
                : `${unconfirmedLocations.length} of your listings need location confirmation.`}
            </p>
            <p className="text-xs text-muted mt-0.5">
              We auto-filled a rough location. Confirm the pin so buyers see the right area on the map.
            </p>
          </div>
          <Link
            href={`/listing/${unconfirmedLocations[0].id}/edit`}
            className="text-xs font-semibold text-brand hover:underline shrink-0"
          >
            Review →
          </Link>
        </div>
      )}

      {/* Welcome Header */}
      <div className="bg-card border border-border rounded-[var(--radius-md)] p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-brand text-white flex items-center justify-center font-semibold text-xl shrink-0">
            {currentUser.avatarInitials}
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground">
              Welcome back, {currentUser.displayName.split(" ")[0]}!
            </h1>
            <p className="text-muted text-sm mt-1">{currentUser.bio}</p>
            <p className="text-subtle text-xs mt-1">
              Member since {currentUser.joinedAt} &middot; {currentUser.city}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-[var(--radius-md)] p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-xs text-muted">{stat.label}</span>
            </div>
            <p className="font-heading font-bold text-2xl text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-10">
        <Link
          href="/post-new"
          className="flex items-center gap-2 bg-brand text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <PlusCircle className="h-4 w-4" />
          Post New Listing
        </Link>
        <Link
          href="/messages"
          className="flex items-center gap-2 bg-surface2 text-foreground font-semibold text-sm px-5 py-2.5 rounded-lg border border-border hover:border-brand/30 transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          View Messages
        </Link>
        <Link
          href="/browse"
          className="flex items-center gap-2 bg-surface2 text-foreground font-semibold text-sm px-5 py-2.5 rounded-lg border border-border hover:border-brand/30 transition-colors"
        >
          <Search className="h-4 w-4" />
          Browse Listings
        </Link>
      </div>

      {/* My Listings */}
      <section>
        <h2 className="font-heading font-bold text-xl text-foreground mb-4">
          My Listings
        </h2>
        {myListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {myListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-[var(--radius-md)] p-10 text-center">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-muted text-sm mb-4">
              You haven&apos;t posted any listings yet.
            </p>
            <Link
              href="/post-new"
              className="inline-block bg-brand text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Create Your First Listing
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
