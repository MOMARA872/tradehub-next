"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/user/UserAvatar";
import { EmptyState } from "@/components/common/EmptyState";
import { NewPostModal } from "@/components/community/NewPostModal";
import { timeAgo } from "@/lib/helpers/format";
import { MessageSquare, Heart, Pin, Filter, Plus } from "lucide-react";

type Category = "all" | "announcement" | "discussion" | "tip" | "question";

type PostCategory = "announcement" | "discussion" | "tip" | "question";

interface PostProfile {
  display_name: string | null;
  avatar_initials: string | null;
  profile_image: string | null;
}

interface CommentProfile {
  display_name: string | null;
  avatar_initials: string | null;
}

interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles: CommentProfile | null;
}

interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: PostCategory;
  is_pinned: boolean;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
  profiles: PostProfile | null;
  comments?: CommunityComment[];
}

const CATEGORY_CONFIG: Record<PostCategory, { label: string; classes: string }> = {
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
    classes: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  },
};

const FILTER_CHIPS: { key: Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "announcement", label: "Announcements" },
  { key: "discussion", label: "Discussions" },
  { key: "tip", label: "Tips" },
  { key: "question", label: "Questions" },
];

function PostSkeleton() {
  return (
    <div className="bg-card border border-border rounded-[var(--radius-md)] p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-24 bg-surface2 rounded-full" />
      </div>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="h-8 w-8 bg-surface2 rounded-full shrink-0" />
        <div className="h-4 w-32 bg-surface2 rounded" />
      </div>
      <div className="h-5 w-3/4 bg-surface2 rounded mb-2" />
      <div className="space-y-1.5 mb-4">
        <div className="h-3.5 w-full bg-surface2 rounded" />
        <div className="h-3.5 w-5/6 bg-surface2 rounded" />
        <div className="h-3.5 w-4/6 bg-surface2 rounded" />
      </div>
      <div className="flex gap-5">
        <div className="h-3.5 w-12 bg-surface2 rounded" />
        <div className="h-3.5 w-12 bg-surface2 rounded" />
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const supabase = createClient();
  const { currentUser, isLoggedIn } = useAuth();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);

    const { data: rawPosts, error } = await supabase
      .from("community_posts")
      .select("*, profiles(display_name, avatar_initials, profile_image)")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error || !rawPosts) {
      setLoading(false);
      return;
    }

    const postIds = rawPosts.map((p) => p.id as string);

    let comments: CommunityComment[] = [];
    if (postIds.length > 0) {
      const { data: rawComments } = await supabase
        .from("community_comments")
        .select("*, profiles(display_name, avatar_initials)")
        .in("post_id", postIds)
        .order("created_at", { ascending: true });

      comments = (rawComments as CommunityComment[]) ?? [];
    }

    const commentsByPost: Record<string, CommunityComment[]> = {};
    for (const comment of comments) {
      if (!commentsByPost[comment.post_id]) {
        commentsByPost[comment.post_id] = [];
      }
      commentsByPost[comment.post_id].push(comment);
    }

    const enriched: CommunityPost[] = (rawPosts as CommunityPost[]).map((post) => ({
      ...post,
      comments: commentsByPost[post.id] ?? [],
    }));

    setPosts(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filtered =
    activeCategory === "all"
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <h1 className="font-heading font-bold text-2xl text-foreground">
          Community Board
        </h1>
        {isLoggedIn && currentUser && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-brand text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            New Post
          </button>
        )}
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
      {loading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          message="No posts found for this category."
          icon="&#x1f4ac;"
        />
      ) : (
        <div className="space-y-5">
          {filtered.map((post) => {
            const catConfig = CATEGORY_CONFIG[post.category];
            const bodyPreview =
              post.body.length > 200
                ? post.body.substring(0, 200) + "..."
                : post.body;

            const authorUser = post.profiles
              ? {
                  id: post.user_id,
                  displayName: post.profiles.display_name ?? "Unknown",
                  avatarInitials: post.profiles.avatar_initials ?? "??",
                  profileImage: post.profiles.profile_image ?? null,
                }
              : null;

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
                    {post.is_pinned && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                        <Pin className="h-3 w-3" />
                        Pinned
                      </span>
                    )}
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <UserAvatar user={authorUser} size="sm" />
                    <div>
                      <span className="text-sm font-semibold text-foreground">
                        {post.profiles?.display_name ?? "Unknown"}
                      </span>
                      <span className="text-xs text-subtle ml-2">
                        {timeAgo(post.created_at)}
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
                      {post.upvotes}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {post.comment_count}
                    </span>
                  </div>
                </div>

                {/* Comments preview */}
                {post.comments && post.comments.length > 0 && (
                  <div className="px-5 pb-4 pt-0">
                    <div className="border-t border-border pt-3 space-y-3">
                      {post.comments.slice(0, 2).map((comment) => {
                        const commentUser = comment.profiles
                          ? {
                              id: comment.user_id,
                              displayName: comment.profiles.display_name ?? "Unknown",
                              avatarInitials: comment.profiles.avatar_initials ?? "??",
                              profileImage: null,
                            }
                          : null;

                        return (
                          <div
                            key={comment.id}
                            className="flex items-start gap-2.5"
                          >
                            <UserAvatar user={commentUser} size="sm" />
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-foreground">
                                {comment.profiles?.display_name ?? "Unknown"}
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

      {/* New Post Modal */}
      {isLoggedIn && currentUser && (
        <NewPostModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          userId={currentUser.id}
          onPostCreated={fetchPosts}
        />
      )}
    </div>
  );
}
