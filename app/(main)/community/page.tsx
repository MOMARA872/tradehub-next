"use client";

import { useState } from "react";
import { COMMUNITY_POSTS } from "@/lib/data/community";
import type { CommunityPost } from "@/lib/data/community";
import type { User } from "@/lib/types";
import { UserAvatar } from "@/components/user/UserAvatar";
import { EmptyState } from "@/components/common/EmptyState";
import { timeAgo } from "@/lib/helpers/format";
import { MessageSquare, Heart, Pin, Filter } from "lucide-react";

type Category = "all" | "announcement" | "discussion" | "tip" | "question";

const CATEGORY_CONFIG: Record<
  CommunityPost["category"],
  { label: string; classes: string }
> = {
  announcement: {
    label: "Announcement",
    classes: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  },
  discussion: {
    label: "Discussion",
    classes: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  },
  tip: {
    label: "Tip",
    classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  },
  question: {
    label: "Question",
    classes: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  },
};

const FILTER_CHIPS: { key: Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "announcement", label: "Announcements" },
  { key: "discussion", label: "Discussions" },
  { key: "tip", label: "Tips" },
  { key: "question", label: "Questions" },
];

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filtered =
    activeCategory === "all"
      ? COMMUNITY_POSTS
      : COMMUNITY_POSTS.filter((p) => p.category === activeCategory);

  // Sort pinned posts first
  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <h1 className="font-heading font-bold text-2xl text-foreground">
          Community Board
        </h1>
        <button className="bg-brand text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
          New Post
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        <Filter className="h-4 w-4 text-muted shrink-0" />
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.key}
            onClick={() => setActiveCategory(chip.key)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              activeCategory === chip.key
                ? "bg-brand text-white border-brand"
                : "bg-surface2 text-muted border-border hover:text-foreground"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {sorted.length === 0 ? (
        <EmptyState
          message="No posts found for this category."
          icon="&#x1f4ac;"
        />
      ) : (
        <div className="space-y-5">
          {sorted.map((post) => {
            const author = null as User | null;
            const catConfig = CATEGORY_CONFIG[post.category];
            const bodyPreview =
              post.body.length > 200
                ? post.body.substring(0, 200) + "..."
                : post.body;

            return (
              <div
                key={post.id}
                className="bg-card border border-border rounded-[var(--radius-md)] overflow-hidden"
              >
                <div className="p-5">
                  {/* Top row: badge + pinned */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span
                      className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${catConfig.classes}`}
                    >
                      {catConfig.label}
                    </span>
                    {post.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                        <Pin className="h-3 w-3" />
                        Pinned
                      </span>
                    )}
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <UserAvatar user={author} size="sm" />
                    <div>
                      <span className="text-sm font-semibold text-foreground">
                        {author?.displayName ?? "Unknown"}
                      </span>
                      <span className="text-xs text-subtle ml-2">
                        {timeAgo(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Title + Body */}
                  <h3 className="font-heading font-semibold text-foreground text-base mb-1.5">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed mb-4">
                    {bodyPreview}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-5 text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {post.commentCount}
                    </span>
                  </div>
                </div>

                {/* Comments preview */}
                {post.comments.length > 0 && (
                  <div className="px-5 pb-4 pt-0">
                    <div className="border-t border-border pt-3 space-y-3">
                      {post.comments.slice(0, 2).map((comment, i) => {
                        const commentUser =
                          null as (User | null);
                        return (
                          <div
                            key={i}
                            className="flex items-start gap-2.5"
                          >
                            <UserAvatar user={commentUser} size="sm" />
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-foreground">
                                {commentUser?.displayName ?? "Unknown"}
                              </span>
                              <p className="text-xs text-muted mt-0.5">
                                {comment.body}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {post.comments.length > 2 && (
                        <p className="text-xs text-brand cursor-pointer hover:underline">
                          View {post.comments.length - 2} more comment
                          {post.comments.length - 2 !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
