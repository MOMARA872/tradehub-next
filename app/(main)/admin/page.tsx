"use client";

import { useState } from "react";
import type { User, Listing } from "@/lib/types";

const USERS: User[] = [];
const LISTINGS: Listing[] = [];
import { DISPUTES } from "@/lib/data/disputes";
import { REVIEWS } from "@/lib/data/reviews";
import { UserAvatar } from "@/components/user/UserAvatar";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate, truncate } from "@/lib/helpers/format";
import {
  Users,
  Package,
  AlertTriangle,
  BarChart3,
  Shield,
  Eye,
} from "lucide-react";

type AdminTab = "dashboard" | "listings" | "users" | "reports";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const openDisputes = DISPUTES.filter((d) => d.status === "under_review");

  const stats = [
    {
      label: "Total Users",
      value: USERS.length,
      Icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Active Listings",
      value: LISTINGS.length,
      Icon: Package,
      color: "text-emerald-500",
    },
    {
      label: "Open Disputes",
      value: openDisputes.length,
      Icon: AlertTriangle,
      color: "text-amber-500",
    },
    {
      label: "Total Reviews",
      value: REVIEWS.length,
      Icon: BarChart3,
      color: "text-purple-500",
    },
  ];

  const tabs: { key: AdminTab; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "listings", label: "Listings" },
    { key: "users", label: "Users" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-7 w-7 text-brand" />
        <h1 className="font-heading font-bold text-2xl text-foreground">
          Admin Panel
        </h1>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-[var(--radius-md)] p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.Icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-xs text-muted">{stat.label}</span>
            </div>
            <p className="font-heading font-bold text-2xl text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-surface2 rounded-[var(--radius-md)] p-1 mb-8 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && <DashboardTab />}
      {activeTab === "listings" && <ListingsTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "reports" && <ReportsTab />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard Tab                                                      */
/* ------------------------------------------------------------------ */
function DashboardTab() {
  const totalListingViews = 0; // TODO: Replace with Supabase aggregate query
  const avgRating =
    REVIEWS.length > 0
      ? (REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length).toFixed(1)
      : "N/A";
  const verifiedUsers = USERS.filter((u) => u.isVerified).length;
  const freeListings = LISTINGS.filter((l) => l.priceType === "free").length;
  const tradeListings = LISTINGS.filter((l) => l.priceType === "trade").length;

  const summaryItems = [
    { label: "Total listing views across all listings", value: totalListingViews.toLocaleString() },
    { label: "Average review rating", value: `${avgRating} / 5` },
    { label: "Verified users", value: `${verifiedUsers} of ${USERS.length}` },
    { label: "Free listings", value: freeListings },
    { label: "Trade/barter listings", value: tradeListings },
    { label: "Unique categories", value: new Set(LISTINGS.map((l) => l.categoryId)).size },
    { label: "Unique cities represented", value: new Set(LISTINGS.map((l) => l.city)).size },
  ];

  return (
    <div className="bg-card border border-border rounded-[var(--radius-md)] p-6">
      <h2 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-brand" />
        Activity Summary
      </h2>
      <div className="space-y-3">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <span className="text-sm text-muted">{item.label}</span>
            <span className="text-sm font-semibold text-foreground">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Listings Tab                                                       */
/* ------------------------------------------------------------------ */
function ListingsTab() {
  if (LISTINGS.length === 0) {
    return <EmptyState message="No listings found." icon="&#x1F4E6;" />;
  }

  return (
    <div className="bg-card border border-border rounded-[var(--radius-md)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-surface2">
              <th className="text-left px-4 py-3 font-semibold text-muted">Title</th>
              <th className="text-left px-4 py-3 font-semibold text-muted">Seller</th>
              <th className="text-left px-4 py-3 font-semibold text-muted">Category</th>
              <th className="text-right px-4 py-3 font-semibold text-muted">Price</th>
              <th className="text-left px-4 py-3 font-semibold text-muted">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-muted">Date</th>
            </tr>
          </thead>
          <tbody>
            {LISTINGS.map((listing, i) => {
              const seller = USERS.find((u) => u.id === listing.userId);
              return (
                <tr
                  key={listing.id}
                  className={`border-b border-border last:border-0 hover:bg-surface2/50 transition-colors ${
                    i % 2 === 1 ? "bg-surface2/30" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-foreground font-medium">
                    {truncate(listing.title, 35)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {seller?.displayName ?? "Unknown"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-brand/10 text-brand px-2 py-0.5 rounded text-xs font-medium">
                      {listing.categoryId}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-foreground font-medium">
                    {listing.priceType === "free"
                      ? "FREE"
                      : listing.priceType === "trade"
                        ? "TRADE"
                        : `$${listing.price}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                      <Eye className="h-3 w-3" />
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-subtle">
                    {formatDate(listing.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Users Tab                                                          */
/* ------------------------------------------------------------------ */
function UsersTab() {
  if (USERS.length === 0) {
    return <EmptyState message="No users found." icon="&#x1F465;" />;
  }

  return (
    <div className="bg-card border border-border rounded-[var(--radius-md)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-surface2">
              <th className="text-left px-4 py-3 font-semibold text-muted">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-muted">City</th>
              <th className="text-left px-4 py-3 font-semibold text-muted">Verified</th>
              <th className="text-right px-4 py-3 font-semibold text-muted">Trust Score</th>
              <th className="text-right px-4 py-3 font-semibold text-muted">Listings</th>
              <th className="text-right px-4 py-3 font-semibold text-muted">Rating</th>
              <th className="text-left px-4 py-3 font-semibold text-muted">Joined</th>
            </tr>
          </thead>
          <tbody>
            {USERS.map((user, i) => (
              <tr
                key={user.id}
                className={`border-b border-border last:border-0 hover:bg-surface2/50 transition-colors ${
                  i % 2 === 1 ? "bg-surface2/30" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={user} size="sm" />
                    <span className="text-foreground font-medium">
                      {user.displayName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{user.city}</td>
                <td className="px-4 py-3">
                  {user.isVerified ? (
                    <span className="inline-block bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full text-xs font-semibold">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-block bg-zinc-500/15 text-zinc-400 border border-zinc-500/25 px-2 py-0.5 rounded-full text-xs font-semibold">
                      Unverified
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`font-semibold ${
                      user.trustScore >= 90
                        ? "text-emerald-400"
                        : user.trustScore >= 80
                          ? "text-amber-400"
                          : "text-zinc-400"
                    }`}
                  >
                    {user.trustScore}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-foreground">
                  {user.listingCount}
                </td>
                <td className="px-4 py-3 text-right text-foreground">
                  {user.ratingAvg.toFixed(1)}
                </td>
                <td className="px-4 py-3 text-subtle">
                  {formatDate(user.joinedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reports Tab                                                        */
/* ------------------------------------------------------------------ */
function ReportsTab() {
  if (DISPUTES.length === 0) {
    return <EmptyState message="No disputes to review." icon="&#x2696;&#xFE0F;" />;
  }

  return (
    <div className="space-y-4">
      {DISPUTES.map((dispute) => {
        const listing = LISTINGS.find((l) => l.id === dispute.listingId);
        const buyer = USERS.find((u) => u.id === dispute.buyerId) ?? null;
        const seller = USERS.find((u) => u.id === dispute.sellerId) ?? null;

        const statusColor =
          dispute.status === "under_review"
            ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
            : dispute.status.startsWith("resolved")
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
              : "bg-zinc-500/15 text-zinc-400 border-zinc-500/25";

        const statusLabel =
          dispute.status === "under_review"
            ? "Under Review"
            : dispute.status === "dismissed"
              ? "Dismissed"
              : dispute.status
                  .replace("resolved_", "Resolved: ")
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());

        return (
          <div
            key={dispute.id}
            className="bg-card border border-border rounded-[var(--radius-md)] p-5"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div>
                <h3 className="font-heading font-semibold text-foreground text-sm mb-1">
                  {listing?.title ?? "Unknown Listing"}
                </h3>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <div className="flex items-center gap-1.5">
                    <UserAvatar user={buyer} size="sm" />
                    <span>{buyer?.displayName ?? "Unknown"}</span>
                    <span className="text-subtle">(Buyer)</span>
                  </div>
                  <span className="text-subtle">vs</span>
                  <div className="flex items-center gap-1.5">
                    <UserAvatar user={seller} size="sm" />
                    <span>{seller?.displayName ?? "Unknown"}</span>
                    <span className="text-subtle">(Seller)</span>
                  </div>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor}`}
              >
                <AlertTriangle className="h-3 w-3" />
                {statusLabel}
              </span>
            </div>

            <p className="text-sm text-muted leading-relaxed mb-3">
              {dispute.reason}
            </p>

            <div className="flex items-center gap-4 text-xs text-subtle">
              <span>Filed {formatDate(dispute.createdAt)}</span>
              <span>Updated {formatDate(dispute.updatedAt)}</span>
              {dispute.resolution && (
                <span className="text-emerald-400 font-medium">
                  {truncate(dispute.resolution, 60)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
