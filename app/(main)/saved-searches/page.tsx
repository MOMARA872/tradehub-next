"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SAVED_SEARCHES } from "@/lib/data/saved-searches";
import type { SavedSearch } from "@/lib/data/saved-searches";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/helpers/format";
import { Search, Bell, BellOff, Trash2, Play, Clock } from "lucide-react";
import Link from "next/link";

function FrequencyBadge({ frequency }: { frequency: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    instant: {
      label: "Instant",
      classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    },
    daily: {
      label: "Daily",
      classes: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    },
    weekly: {
      label: "Weekly",
      classes: "bg-purple-500/15 text-purple-400 border-purple-500/25",
    },
  };

  const { label, classes } = config[frequency] ?? {
    label: frequency,
    classes: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${classes}`}
    >
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
}

export default function SavedSearchesPage() {
  const { currentUser, isLoggedIn, loading: authLoading } = useAuth();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [toggledAlerts, setToggledAlerts] = useState<Map<string, boolean>>(
    new Map()
  );

  if (authLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 flex justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in">
        <div className="text-5xl mb-4">&#x1f512;</div>
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
          Sign in to view saved searches
        </h1>
        <p className="text-muted text-sm mb-6">
          You need to be logged in to access your saved searches.
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

  const mySearches = SAVED_SEARCHES.filter(
    (s) => s.userId === currentUser.id && !deletedIds.has(s.id)
  );

  function getAlertEnabled(search: SavedSearch) {
    return toggledAlerts.has(search.id)
      ? toggledAlerts.get(search.id)!
      : search.alertEnabled;
  }

  function toggleAlert(id: string, current: boolean) {
    setToggledAlerts((prev) => {
      const next = new Map(prev);
      next.set(id, !current);
      return next;
    });
  }

  function deleteSearch(id: string) {
    setDeletedIds((prev) => new Set(prev).add(id));
  }

  function buildSearchUrl(search: SavedSearch) {
    const params = new URLSearchParams();
    if (search.query) params.set("q", search.query);
    if (search.filters.categories && search.filters.categories.length > 0) {
      params.set("categories", search.filters.categories.join(","));
    }
    if (search.filters.maxPrice !== undefined) {
      params.set("maxPrice", String(search.filters.maxPrice));
    }
    if (search.filters.priceType) {
      params.set("priceType", search.filters.priceType);
    }
    return `/search?${params.toString()}`;
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Page Header */}
      <h1 className="font-heading font-bold text-2xl text-foreground mb-4">
        Saved Searches
      </h1>

      {/* Info Banner */}
      <div className="bg-brand/10 border border-brand/20 rounded-[var(--radius-md)] p-4 mb-8 flex items-start gap-3">
        <Search className="h-5 w-5 text-brand shrink-0 mt-0.5" />
        <p className="text-sm text-foreground">
          Save your favorite searches and get notified when new matching listings
          appear. Toggle alerts on or off for each search.
        </p>
      </div>

      {mySearches.length === 0 ? (
        <EmptyState
          message="No saved searches yet. Search for something and save it to get notified of new matches."
          icon="&#x1f50d;"
        />
      ) : (
        <div className="space-y-4">
          {mySearches.map((search) => {
            const alertOn = getAlertEnabled(search);
            const filters = search.filters;

            return (
              <div
                key={search.id}
                className="bg-card border border-border rounded-[var(--radius-md)] p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left: name + details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-heading font-semibold text-foreground text-base">
                        {search.name}
                      </h3>
                      <FrequencyBadge frequency={search.frequency} />
                      <span className="text-xs text-muted">
                        {search.matchCount} match
                        {search.matchCount !== 1 ? "es" : ""}
                      </span>
                    </div>

                    {/* Query */}
                    <div className="flex items-center gap-2 mb-3">
                      <Search className="h-3.5 w-3.5 text-muted shrink-0" />
                      <span className="text-sm text-muted">
                        &quot;{search.query}&quot;
                      </span>
                    </div>

                    {/* Filter Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {filters.categories &&
                        filters.categories.length > 0 &&
                        filters.categories.map((cat) => (
                          <span
                            key={cat}
                            className="text-[11px] bg-brand/10 text-brand px-2 py-0.5 rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                      {filters.maxPrice !== undefined && (
                        <span className="text-[11px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                          Max ${filters.maxPrice}
                        </span>
                      )}
                      {filters.priceType && (
                        <span className="text-[11px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">
                          {filters.priceType}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-subtle">
                      Created {formatDate(search.createdAt)}
                    </p>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Alert Toggle */}
                    <button
                      onClick={() => toggleAlert(search.id, alertOn)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
                        alertOn
                          ? "bg-brand/10 text-brand border-brand/25 hover:bg-brand/20"
                          : "bg-surface2 text-muted border-border hover:text-foreground"
                      }`}
                      title={alertOn ? "Alerts on" : "Alerts off"}
                    >
                      {alertOn ? (
                        <Bell className="h-3.5 w-3.5" />
                      ) : (
                        <BellOff className="h-3.5 w-3.5" />
                      )}
                      {alertOn ? "On" : "Off"}
                    </button>

                    {/* Run Search */}
                    <Link
                      href={buildSearchUrl(search)}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-brand text-white px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Run Search
                    </Link>

                    {/* Delete */}
                    <button
                      onClick={() => deleteSearch(search.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
                      title="Delete saved search"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
