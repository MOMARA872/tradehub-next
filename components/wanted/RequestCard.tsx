"use client";

import Link from "next/link";
import { UserAvatar } from "@/components/user/UserAvatar";
import { CategoryIcon } from "@/lib/helpers/categoryIcon";
import { timeAgo } from "@/lib/helpers/format";

interface RequestCardProps {
  request: {
    id: string;
    title: string;
    description: string;
    category_id: string;
    trade_type: string;
    created_at: string;
    profiles: {
      display_name: string | null;
      avatar_initials: string | null;
      profile_image: string | null;
    } | null;
  };
  categories: { id: string; name: string; icon: string }[];
  onRespond?: () => void;
}

const TRADE_TYPE_BADGE: Record<string, { label: string; classes: string }> = {
  buy: {
    label: "Buy",
    classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  },
  trade: {
    label: "Trade",
    classes: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  },
  either: {
    label: "Either",
    classes: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  },
};

export function RequestCard({ request, categories, onRespond }: RequestCardProps) {
  const category = categories.find((c) => c.id === request.category_id);

  const tradeConfig =
    TRADE_TYPE_BADGE[request.trade_type] ?? TRADE_TYPE_BADGE.either;

  const descriptionPreview =
    request.description && request.description.length > 150
      ? request.description.substring(0, 150) + "..."
      : request.description;

  const authorUser = request.profiles
    ? {
        id: "unknown",
        displayName: request.profiles.display_name ?? "Unknown",
        avatarInitials: request.profiles.avatar_initials ?? "??",
        profileImage: request.profiles.profile_image ?? null,
      }
    : null;

  return (
    <div className="bg-card border border-border rounded-[var(--radius-md)] p-5 flex flex-col gap-3">
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {category && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-surface2 text-muted border-border">
            <CategoryIcon name={category.icon} className="h-3 w-3" />
            {category.name}
          </span>
        )}
        <span
          className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${tradeConfig.classes}`}
        >
          {tradeConfig.label}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-heading font-bold text-foreground text-base leading-snug">
        {request.title}
      </h3>

      {/* Description preview */}
      {descriptionPreview && (
        <p className="text-sm text-muted leading-relaxed">
          {descriptionPreview}
        </p>
      )}

      {/* Author row */}
      <div className="flex items-center gap-2.5 mt-auto pt-1">
        <UserAvatar user={authorUser} size="sm" />
        <div className="min-w-0">
          <span className="text-sm font-semibold text-foreground truncate block">
            {request.profiles?.display_name ?? "Unknown"}
          </span>
          <span className="text-xs text-subtle">{timeAgo(request.created_at)}</span>
        </div>
      </div>

      {/* I have this! button */}
      <Link
        href="/messages"
        onClick={onRespond}
        className="mt-1 w-full text-center bg-brand text-white font-semibold text-sm py-2 rounded-lg hover:opacity-90 transition-opacity"
      >
        I have this!
      </Link>
    </div>
  );
}
