"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { DISPUTES } from "@/lib/data/disputes";
import type { Dispute } from "@/lib/data/disputes";
import type { User } from "@/lib/types";
import { CONDITIONS } from "@/lib/data/conditions";
import type { ConditionKey } from "@/lib/types";
import { UserAvatar } from "@/components/user/UserAvatar";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate, timeAgo } from "@/lib/helpers/format";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Camera,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";

type FilterTab = "all" | "open" | "resolved" | "dismissed";

function isOpen(status: string) {
  return status === "under_review";
}
function isResolved(status: string) {
  return status.startsWith("resolved");
}
function isDismissed(status: string) {
  return status === "dismissed";
}

function DisputeStatusBadge({ status }: { status: string }) {
  let label: string;
  let classes: string;
  let Icon: typeof CheckCircle;

  if (status === "under_review") {
    label = "Under Review";
    classes = "bg-amber-500/15 text-amber-400 border-amber-500/25";
    Icon = Clock;
  } else if (status.startsWith("resolved")) {
    label = status
      .replace("resolved_", "Resolved: ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    classes = "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
    Icon = CheckCircle;
  } else if (status === "dismissed") {
    label = "Dismissed";
    classes = "bg-zinc-500/15 text-zinc-400 border-zinc-500/25";
    Icon = XCircle;
  } else {
    label = status;
    classes = "bg-zinc-500/15 text-zinc-400 border-zinc-500/25";
    Icon = FileText;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${classes}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function ConditionBadge({ conditionKey }: { conditionKey: string }) {
  const condition = CONDITIONS[conditionKey as ConditionKey];
  if (!condition) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-500/15 text-zinc-400">
        {conditionKey}
      </span>
    );
  }
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded"
      style={{
        backgroundColor: `${condition.color}20`,
        color: condition.color,
      }}
    >
      {condition.emoji} {condition.badgeText}
    </span>
  );
}

function TimelineSection({ timeline }: { timeline: Dispute["timeline"] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? timeline : timeline.slice(0, 2);

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors mb-3"
      >
        <Clock className="h-3.5 w-3.5" />
        Timeline ({timeline.length} events)
        {timeline.length > 2 &&
          (expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          ))}
      </button>
      <div className="relative pl-4 space-y-3">
        {/* Vertical line */}
        <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border" />
        {visible.map((entry, i) => (
          <div key={i} className="relative flex gap-3 items-start">
            <div className="absolute left-[-13px] top-1.5 h-2 w-2 rounded-full bg-brand border-2 border-card" />
            <div className="min-w-0">
              <p className="text-sm text-foreground">{entry.note}</p>
              <p className="text-xs text-subtle mt-0.5">
                {formatDate(entry.at)} &middot; {timeAgo(entry.at)}
              </p>
            </div>
          </div>
        ))}
      </div>
      {!expanded && timeline.length > 2 && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs text-brand hover:underline"
        >
          Show {timeline.length - 2} more events
        </button>
      )}
    </div>
  );
}

export default function DisputesPage() {
  const { currentUser, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in">
        <div className="text-5xl mb-4">&#x1f512;</div>
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
          Sign in to view disputes
        </h1>
        <p className="text-muted text-sm mb-6">
          You need to be logged in to access condition disputes.
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

  const myDisputes = DISPUTES.filter(
    (d) => d.buyerId === currentUser.id || d.sellerId === currentUser.id
  );

  const openCount = myDisputes.filter((d) => isOpen(d.status)).length;
  const resolvedCount = myDisputes.filter((d) => isResolved(d.status)).length;
  const dismissedCount = myDisputes.filter((d) => isDismissed(d.status)).length;

  const filtered =
    activeTab === "all"
      ? myDisputes
      : activeTab === "open"
        ? myDisputes.filter((d) => isOpen(d.status))
        : activeTab === "resolved"
          ? myDisputes.filter((d) => isResolved(d.status))
          : myDisputes.filter((d) => isDismissed(d.status));

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: `All (${myDisputes.length})` },
    { key: "open", label: `Open (${openCount})` },
    { key: "resolved", label: `Resolved (${resolvedCount})` },
    { key: "dismissed", label: `Dismissed (${dismissedCount})` },
  ];

  const stats = [
    {
      label: "Open",
      value: openCount,
      Icon: Clock,
      color: "text-amber-500",
    },
    {
      label: "Resolved",
      value: resolvedCount,
      Icon: CheckCircle,
      color: "text-emerald-500",
    },
    {
      label: "Dismissed",
      value: dismissedCount,
      Icon: XCircle,
      color: "text-zinc-400",
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Page Header */}
      <h1 className="font-heading font-bold text-2xl text-foreground mb-6">
        Condition Disputes
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
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

      {/* Filter Tabs */}
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

      {/* Dispute Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          message="No disputes found for this filter."
          icon="&#x2696;&#xFE0F;"
        />
      ) : (
        <div className="space-y-6">
          {filtered.map((dispute) => {
            const listing = null as ({ title: string } | null);
            const buyer = null as (User | null);
            const seller = null as (User | null);

            return (
              <div
                key={dispute.id}
                className="bg-card border border-border rounded-[var(--radius-md)] overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-border">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-heading font-semibold text-foreground text-base mb-1">
                        {listing?.title ?? "Unknown Listing"}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted">
                        <div className="flex items-center gap-1.5">
                          <UserAvatar user={buyer} size="sm" />
                          <span>{buyer?.displayName ?? "Unknown"}</span>
                          <span className="text-xs text-subtle">(Buyer)</span>
                        </div>
                        <span className="text-subtle">vs</span>
                        <div className="flex items-center gap-1.5">
                          <UserAvatar user={seller} size="sm" />
                          <span>{seller?.displayName ?? "Unknown"}</span>
                          <span className="text-xs text-subtle">(Seller)</span>
                        </div>
                      </div>
                    </div>
                    <DisputeStatusBadge status={dispute.status} />
                  </div>
                  <p className="text-xs text-subtle mt-2">
                    Filed {formatDate(dispute.createdAt)} &middot;{" "}
                    {timeAgo(dispute.createdAt)}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  {/* Condition Comparison */}
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">Listed as</span>
                      <ConditionBadge conditionKey={dispute.listedCondition} />
                    </div>
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">Claimed</span>
                      <ConditionBadge conditionKey={dispute.claimedCondition} />
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mb-4">
                    <p className="text-sm text-foreground leading-relaxed">
                      {dispute.reason}
                    </p>
                  </div>

                  {/* Evidence Photos */}
                  {dispute.evidencePhotos.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
                        <Camera className="h-3.5 w-3.5" />
                        Evidence Photos ({dispute.evidencePhotos.length})
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {dispute.evidencePhotos.map((photo, i) => (
                          <div
                            key={i}
                            className="h-16 w-16 rounded-md border border-border overflow-hidden bg-surface2"
                          >
                            <Image
                              src={photo}
                              alt={`Evidence ${i + 1}`}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolution */}
                  {dispute.resolution && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[var(--radius-md)] p-3 mb-4">
                      <p className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Resolution
                      </p>
                      <p className="text-sm text-foreground">
                        {dispute.resolution}
                      </p>
                    </div>
                  )}

                  {/* Timeline */}
                  {dispute.timeline.length > 0 && (
                    <TimelineSection timeline={dispute.timeline} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
