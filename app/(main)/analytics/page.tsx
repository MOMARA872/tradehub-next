"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LISTING_ANALYTICS } from "@/lib/data/analytics";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Eye,
  Users,
  Bookmark,
  Share2,
  Clock,
  TrendingUp,
  Smartphone,
  Monitor,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Lock, Crown } from "lucide-react";

export default function AnalyticsPage() {
  const { currentUser, isLoggedIn, loading: authLoading } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (authLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in">
        <div className="flex justify-center mb-4"><Lock className="h-12 w-12 text-muted" /></div>
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
          Sign in to view analytics
        </h1>
        <p className="text-muted text-sm mb-6">
          You need to be logged in to access listing analytics.
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

  const isPro = currentUser.tier === "pro" &&
    (currentUser.subscriptionStatus === "active" || currentUser.subscriptionStatus === "trialing");

  if (!isPro) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in">
        <div className="flex justify-center mb-4"><Crown className="h-12 w-12 text-brand" /></div>
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
          Analytics is a Pro feature
        </h1>
        <p className="text-muted text-sm mb-6 max-w-md mx-auto">
          Upgrade to TradeHub Pro to access listing analytics, track views, and monitor performance.
        </p>
        <Link
          href="/settings"
          className="inline-block bg-brand text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Upgrade to Pro
        </Link>
      </div>
    );
  }

  const myAnalytics = LISTING_ANALYTICS.filter(
    (a) => a.userId === currentUser.id
  );

  if (myAnalytics.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
        <h1 className="font-heading font-bold text-2xl text-foreground mb-6">
          Listing Analytics
        </h1>
        <EmptyState
          message="No analytics data yet. Create a listing to start tracking performance."
          icon="&#x1f4ca;"
        />
      </div>
    );
  }

  const analytics = myAnalytics[selectedIndex];
  const listing = null;

  const totalViews = analytics.views.reduce((sum, v) => sum + v, 0);
  const totalVisitors = analytics.uniqueVisitors.reduce(
    (sum, v) => sum + v,
    0
  );
  const maxView = Math.max(...analytics.views);

  const kpis = [
    {
      label: "Total Views",
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: "text-brand",
    },
    {
      label: "Unique Visitors",
      value: totalVisitors.toLocaleString(),
      icon: Users,
      color: "text-purple-400",
    },
    {
      label: "Saves",
      value: analytics.saves.toString(),
      icon: Bookmark,
      color: "text-amber-400",
    },
    {
      label: "Shares",
      value: analytics.shares.toString(),
      icon: Share2,
      color: "text-sky-400",
    },
    {
      label: "Offer Rate",
      value: `${analytics.offerRate}%`,
      icon: TrendingUp,
      color: "text-emerald-400",
    },
    {
      label: "Avg Time on Page",
      value: `${analytics.avgTimeOnPage}s`,
      icon: Clock,
      color: "text-rose-400",
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Header */}
      <h1 className="font-heading font-bold text-2xl text-foreground mb-6">
        Listing Analytics
      </h1>

      {/* Listing Selector */}
      {myAnalytics.length > 1 && (
        <div className="mb-6">
          <label
            htmlFor="listing-select"
            className="block text-xs text-muted mb-1.5"
          >
            Select listing
          </label>
          <select
            id="listing-select"
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            className="bg-surface2 border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand focus:outline-none"
          >
            {myAnalytics.map((a, i) => (
              <option key={a.listingId} value={i}>
                {a.listingId}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Current Listing Title - TODO: fetch from Supabase */}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-card border border-border rounded-[var(--radius-md)] p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              <span className="text-xs text-muted">{kpi.label}</span>
            </div>
            <p className="font-heading font-bold text-2xl text-foreground">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Views Bar Chart */}
      <div className="bg-card border border-border rounded-[var(--radius-md)] p-5 mb-8">
        <h2 className="font-heading font-semibold text-base text-foreground mb-4">
          Views Over Time
        </h2>
        <div className="flex items-end gap-1.5 h-40">
          {analytics.views.map((v, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end h-full"
            >
              <div
                className="w-full bg-brand rounded-t-sm min-h-[2px] transition-all"
                style={{
                  height: `${maxView > 0 ? (v / maxView) * 100 : 0}%`,
                }}
                title={`Day ${i + 1}: ${v} views`}
              />
              <span className="text-[10px] text-subtle mt-1">{i + 1}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-subtle mt-2 text-center">Day</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <div className="bg-card border border-border rounded-[var(--radius-md)] p-5">
          <h2 className="font-heading font-semibold text-base text-foreground mb-4">
            Top Referrers
          </h2>
          <ul className="space-y-2.5">
            {analytics.topReferrers.map((ref, i) => (
              <li
                key={ref}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground">{ref}</span>
                <span className="text-xs text-muted font-mono">
                  #{i + 1}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Demographics */}
        <div className="bg-card border border-border rounded-[var(--radius-md)] p-5">
          <h2 className="font-heading font-semibold text-base text-foreground mb-4">
            Device Demographics
          </h2>

          {/* Mobile */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Smartphone className="h-4 w-4 text-brand" />
                <span>Mobile</span>
              </div>
              <span className="text-sm font-medium text-foreground">
                {analytics.demographics.mobile}%
              </span>
            </div>
            <div className="h-3 bg-surface2 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all"
                style={{ width: `${analytics.demographics.mobile}%` }}
              />
            </div>
          </div>

          {/* Desktop */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Monitor className="h-4 w-4 text-purple-400" />
                <span>Desktop</span>
              </div>
              <span className="text-sm font-medium text-foreground">
                {analytics.demographics.desktop}%
              </span>
            </div>
            <div className="h-3 bg-surface2 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 rounded-full transition-all"
                style={{ width: `${analytics.demographics.desktop}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
