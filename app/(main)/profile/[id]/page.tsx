"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { User, Listing } from "@/lib/types";
import { dbProfileToUser, dbListingToListing } from "@/lib/types";
import { REVIEWS } from "@/lib/data/reviews";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/user/UserAvatar";
import { StarRating } from "@/components/user/StarRating";
import { TrustBadge } from "@/components/user/TrustBadge";
import { ListingCard } from "@/components/listing/ListingCard";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/helpers/format";
import {
  CheckCircle,
  MapPin,
  Calendar,
  MessageSquare,
  Shield,
  Pencil,
  Camera,
  X,
  Loader2,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Send,
  Plus,
} from "lucide-react";
import { REGIONS } from "@/lib/data/regions";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

export default function ProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { currentUser } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"listings" | "reviews" | "community">("listings");
  const [user, setUser] = useState<User | null>(null);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [liveStats, setLiveStats] = useState({ offerCount: 0, threadCount: 0 });
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const [
        { data: profile },
        { data: listings },
        { count: offerCount },
        { count: threadCount },
        { data: posts },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase
          .from("listings")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false }),
        supabase
          .from("offers")
          .select("*", { count: "exact", head: true })
          .eq("buyer_id", userId),
        supabase
          .from("threads")
          .select("*", { count: "exact", head: true })
          .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
        supabase
          .from("community_posts")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      if (!mounted) return;

      setUser(profile ? dbProfileToUser(profile) : null);
      setUserListings((listings ?? []).map(dbListingToListing));
      setLiveStats({ offerCount: offerCount ?? 0, threadCount: threadCount ?? 0 });
      setCommunityPosts((posts ?? []) as CommunityPost[]);
      setProfileLoading(false);
    }

    loadProfile();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (profileLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <EmptyState message="User not found" icon="Search" />
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;
  const userReviews = REVIEWS.filter((r) => r.revieweeId === user.id);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Cover Banner */}
      <div className="relative h-32 rounded-[var(--radius-lg)] overflow-hidden">
        {user.coverImage ? (
          <Image
            src={user.coverImage}
            alt="Cover"
            fill
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-brand to-brand2" />
        )}
        {isOwnProfile && (
          <label className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-black/70 transition-colors">
            <Camera className="h-3.5 w-3.5" />
            Edit Cover
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const path = `${user.id}/${crypto.randomUUID()}.${file.name.split(".").pop()}`;
                const { error: uploadErr } = await supabase.storage
                  .from("profile-covers")
                  .upload(path, file);
                if (uploadErr) { alert(uploadErr.message); return; }
                const { data: { publicUrl } } = supabase.storage
                  .from("profile-covers")
                  .getPublicUrl(path);
                await supabase
                  .from("profiles")
                  .update({ cover_image: publicUrl })
                  .eq("id", user.id);
                window.location.reload();
              }}
            />
          </label>
        )}
      </div>

      {/* Avatar - overlaps banner */}
      <div className="relative z-10 px-4 sm:px-6 -mt-10 mb-3">
        <div className="ring-4 ring-card rounded-full inline-block">
          <UserAvatar user={user} size="lg" />
        </div>
      </div>

      {/* Profile Header - below banner */}
      <div className="px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Name & Info */}
          <div className="flex-1">
            <h1 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
              {user.displayName}
              {user.isVerified && (
                <span className="inline-flex items-center gap-1">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-[10px] font-semibold bg-brand/10 text-brand px-1.5 py-0.5 rounded-full">
                    PRO
                  </span>
                </span>
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {user.city}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Member since {formatDate(user.joinedAt)}
              </span>
            </div>
            {user.bio && (
              <p className="text-sm text-muted mt-2 max-w-lg">{user.bio}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pb-1">
            {isOwnProfile ? (
              <EditProfileButton user={user} />
            ) : (
              <>
                <Link
                  href="/messages"
                  className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  <MessageSquare className="h-4 w-4" />
                  Message
                </Link>
                <button className="px-4 py-2 bg-surface2 text-foreground text-sm font-medium rounded-lg border border-border hover:bg-surface3 transition-colors">
                  Follow
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <StarRating rating={user.ratingAvg} />
          </div>
          <p className="text-xs text-muted">
            {user.ratingAvg.toFixed(1)} ({userReviews.length} reviews)
          </p>
        </div>
        <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Shield className="h-4 w-4 text-brand" />
            <span className="text-sm font-semibold text-foreground">
              {Math.min(100, 50 + userListings.length * 5 + liveStats.offerCount * 3 + liveStats.threadCount * 2)}%
            </span>
          </div>
          <p className="text-xs text-muted">
            <TrustBadge score={Math.min(100, 50 + userListings.length * 5 + liveStats.offerCount * 3 + liveStats.threadCount * 2)} />
          </p>
        </div>
        <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 text-center">
          <p className="text-sm font-semibold text-foreground mb-1">
            {liveStats.threadCount > 0 ? Math.min(100, Math.round((liveStats.threadCount / (liveStats.threadCount + 1)) * 100)) : 0}%
          </p>
          <p className="text-xs text-muted">Response Rate</p>
        </div>
        <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 text-center">
          <p className="text-sm font-semibold text-foreground mb-1">
            {userListings.length}
          </p>
          <p className="text-xs text-muted">Listings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-border flex gap-6">
        <button
          onClick={() => setActiveTab("listings")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "listings"
              ? "text-brand"
              : "text-muted hover:text-foreground"
          }`}
        >
          Listings ({userListings.length})
          {activeTab === "listings" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "reviews"
              ? "text-brand"
              : "text-muted hover:text-foreground"
          }`}
        >
          Reviews ({userReviews.length})
          {activeTab === "reviews" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("community")}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === "community"
              ? "text-brand"
              : "text-muted hover:text-foreground"
          }`}
        >
          Community ({communityPosts.length})
          {activeTab === "community" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "listings" && (
          <>
            {userListings.length === 0 ? (
              <EmptyState message="No listings yet" icon="Package" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "reviews" && (
          <>
            {userReviews.length === 0 ? (
              <EmptyState message="No reviews yet" icon="Star" />
            ) : (
              <div className="space-y-4">
                {userReviews.map((review) => {
                  const reviewer = null as (User | null);

                  return (
                    <div
                      key={review.id}
                      className="bg-card border border-border rounded-[var(--radius-md)] p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={reviewer || null} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {reviewer?.displayName || "Unknown"}
                            </p>
                            <p className="text-[10px] text-subtle">
                              as {review.reviewerRole} &middot;{" "}
                              {formatDate(review.createdAt)}
                            </p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>

                      <p className="text-sm text-muted leading-relaxed">
                        {review.comment}
                      </p>

                      {review.quickTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {review.quickTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-0.5 text-[10px] rounded-full bg-success/10 text-success font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {review.sellerReply && (
                        <div className="mt-3 pl-3 border-l-2 border-brand/30">
                          <p className="text-[10px] text-subtle font-medium mb-0.5">
                            Reply from {user.displayName}:
                          </p>
                          <p className="text-xs text-muted">{review.sellerReply}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "community" && (
          <CommunityTab
            userId={userId}
            isOwnProfile={isOwnProfile}
            posts={communityPosts}
            onPostsChange={setCommunityPosts}
          />
        )}
      </div>
    </div>
  );
}

interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  body: string;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
}

interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: { display_name: string; avatar_initials: string };
}

function CommunityTab({
  userId,
  isOwnProfile,
  posts,
  onPostsChange,
}: {
  userId: string;
  isOwnProfile: boolean;
  posts: CommunityPost[];
  onPostsChange: (posts: CommunityPost[]) => void;
}) {
  const supabase = createClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, CommunityComment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});

  async function handlePost() {
    if (!title.trim()) return;
    setPosting(true);
    const { data, error } = await supabase
      .from("community_posts")
      .insert({ user_id: userId, title: title.trim(), body: body.trim() })
      .select()
      .single();
    setPosting(false);
    if (error) { alert(error.message); return; }
    onPostsChange([data as CommunityPost, ...posts]);
    setTitle("");
    setBody("");
    setShowForm(false);
  }

  async function handleVote(postId: string, direction: "up" | "down") {
    const field = direction === "up" ? "upvotes" : "downvotes";
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    await supabase
      .from("community_posts")
      .update({ [field]: post[field] + 1 })
      .eq("id", postId);
    onPostsChange(
      posts.map((p) => (p.id === postId ? { ...p, [field]: p[field] + 1 } : p))
    );
  }

  async function toggleComments(postId: string) {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    setExpandedPost(postId);
    if (!comments[postId]) {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }));
      const { data } = await supabase
        .from("community_comments")
        .select("*, profiles(display_name, avatar_initials)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      setComments((prev) => ({ ...prev, [postId]: (data ?? []) as CommunityComment[] }));
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function handleComment(postId: string) {
    const text = commentText[postId]?.trim();
    if (!text) return;
    const { data, error } = await supabase
      .from("community_comments")
      .insert({ post_id: postId, user_id: userId, body: text })
      .select("*, profiles(display_name, avatar_initials)")
      .single();
    if (error) { alert(error.message); return; }
    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] ?? []), data as CommunityComment],
    }));
    setCommentText((prev) => ({ ...prev, [postId]: "" }));
    // Update comment count locally
    await supabase
      .from("community_posts")
      .update({ comment_count: (posts.find((p) => p.id === postId)?.comment_count ?? 0) + 1 })
      .eq("id", postId);
    onPostsChange(
      posts.map((p) =>
        p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
      )
    );
  }

  function timeAgoShort(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  }

  return (
    <div className="space-y-4">
      {/* New Post Form */}
      {isOwnProfile && (
        <div>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 w-full bg-surface2 border border-border rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface3 transition-colors text-left"
            >
              <Plus className="h-4 w-4" />
              Create a post...
            </button>
          ) : (
            <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What's on your mind? (optional)"
                rows={3}
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowForm(false); setTitle(""); setBody(""); }}
                  className="px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePost}
                  disabled={posting || !title.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Post
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <EmptyState message="No community posts yet" icon="MessageCircle" />
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            className="bg-card border border-border rounded-[var(--radius-md)] overflow-hidden"
          >
            <div className="flex">
              {/* Vote Column */}
              <div className="flex flex-col items-center gap-0.5 px-3 py-4 bg-surface2/50">
                <button
                  onClick={() => handleVote(post.id, "up")}
                  className="p-1 rounded hover:bg-success/10 text-muted hover:text-success transition-colors"
                >
                  <ChevronUp className="h-5 w-5" />
                </button>
                <span className="text-xs font-semibold text-foreground min-w-[20px] text-center">
                  {post.upvotes - post.downvotes}
                </span>
                <button
                  onClick={() => handleVote(post.id, "down")}
                  className="p-1 rounded hover:bg-danger/10 text-muted hover:text-danger transition-colors"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-4">
                <h3 className="text-sm font-semibold text-foreground">{post.title}</h3>
                {post.body && (
                  <p className="text-sm text-muted mt-1 leading-relaxed">{post.body}</p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {post.comment_count} {post.comment_count === 1 ? "comment" : "comments"}
                  </button>
                  <span className="text-[10px] text-subtle">
                    {timeAgoShort(post.created_at)} ago
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded Comments */}
            {expandedPost === post.id && (
              <div className="border-t border-border bg-surface2/30 px-4 py-3 space-y-3">
                {loadingComments[post.id] ? (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted" />
                  </div>
                ) : (
                  <>
                    {(comments[post.id] ?? []).map((c) => (
                      <div key={c.id} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand/20 text-brand flex items-center justify-center text-[9px] font-semibold flex-shrink-0 mt-0.5">
                          {c.profiles?.avatar_initials ?? "??"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">
                              {c.profiles?.display_name ?? "Unknown"}
                            </span>
                            <span className="text-[10px] text-subtle">
                              {timeAgoShort(c.created_at)} ago
                            </span>
                          </div>
                          <p className="text-xs text-muted mt-0.5">{c.body}</p>
                        </div>
                      </div>
                    ))}
                    {(comments[post.id] ?? []).length === 0 && (
                      <p className="text-xs text-subtle text-center py-1">No comments yet</p>
                    )}
                  </>
                )}

                {/* Add Comment */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={commentText[post.id] ?? ""}
                    onChange={(e) =>
                      setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleComment(post.id);
                      }
                    }}
                    placeholder="Add a comment..."
                    className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <button
                    onClick={() => handleComment(post.id)}
                    disabled={!commentText[post.id]?.trim()}
                    className="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function EditProfileButton({ user }: { user: User }) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [city, setCity] = useState(user.city);
  const [profileImage, setProfileImage] = useState(user.profileImage || "");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [saveError, setSaveError] = useState("");

  // 60-day cooldown for display name changes. NULL = never edited = free to change.
  const cooldownEnd = user.lastDisplayNameEditAt
    ? new Date(new Date(user.lastDisplayNameEditAt).getTime() + 60 * 24 * 60 * 60 * 1000)
    : null;
  const canEditName = !cooldownEnd || cooldownEnd <= new Date();
  const daysRemaining = cooldownEnd && !canEditName
    ? Math.ceil((cooldownEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const [pendingFile, setPendingFile] = useState<File | null>(null);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setProfileImage(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Upload new profile photo to Supabase storage if one was selected
      let resolvedImage: string | null = profileImage || null;
      if (pendingFile) {
        const ext = pendingFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("listing-photos")
          .upload(path, pendingFile);
        if (uploadErr) throw new Error(`Photo upload failed: ${uploadErr.message}`);
        const { data: { publicUrl } } = supabase.storage
          .from("listing-photos")
          .getPublicUrl(path);
        resolvedImage = publicUrl;
      } else if (profileImage && profileImage.startsWith("blob:")) {
        // Stale blob URL — clear it
        resolvedImage = null;
      }

      const updates: Record<string, unknown> = {
        bio: bio.trim(),
        city,
        profile_image: resolvedImage,
      };

      // Only include display_name if the user actually changed it and cooldown allows it.
      const trimmedName = displayName.trim();
      if (canEditName && trimmedName && trimmedName !== user.displayName) {
        updates.display_name = trimmedName;
        const parts = trimmedName.split(" ");
        updates.avatar_initials = parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : trimmedName.slice(0, 2).toUpperCase();
      }

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Update failed — please try again");

      setOpen(false);
      window.location.reload();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="flex items-center gap-2 px-5 py-2 bg-surface2 text-foreground text-sm font-medium rounded-lg border border-border hover:bg-surface3 transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit Profile
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="bg-card border-border p-6 max-w-md">
          <DialogTitle className="font-heading font-bold text-lg text-foreground mb-1">
            Edit Profile
          </DialogTitle>
          <DialogDescription className="text-xs text-muted mb-5">
            Update your name, bio, photo, and location.
          </DialogDescription>

          <div className="space-y-5">
            {/* Profile Image */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-2">
                Profile Photo
              </label>
              <div className="flex items-center gap-4">
                {profileImage && (profileImage.startsWith("blob:") || profileImage.includes(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname)) ? (
                  <div className="relative">
                    <Image
                      src={profileImage}
                      alt="Profile"
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-full object-cover"
                      unoptimized={profileImage.startsWith("blob:")}
                    />
                    <button
                      type="button"
                      onClick={() => setProfileImage("")}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-brand text-white flex items-center justify-center text-xl font-semibold">
                    {user.avatarInitials}
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-2 bg-surface2 text-foreground text-xs font-medium rounded-lg border border-border hover:bg-surface3 transition-colors cursor-pointer">
                  <Camera className="h-3.5 w-3.5" />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Display Name (60-day cooldown) */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={!canEditName}
                maxLength={50}
                placeholder="Your display name"
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {!canEditName && (
                <p className="text-[10px] text-muted mt-1">
                  You can change your name again in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
                </p>
              )}
              {canEditName && (
                <p className="text-[10px] text-subtle mt-1">
                  Name changes have a 60-day cooldown
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell the community about yourself..."
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand resize-none"
              />
              <p className="text-[10px] text-subtle mt-1">{bio.length}/200 characters</p>
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subtle" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand appearance-none"
                >
                  {REGIONS.filter((r) => r.id !== "all").map((r) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {saveError && (
            <p className="text-xs text-danger mt-4">{saveError}</p>
          )}

          <div className="flex gap-2 mt-6">
            <DialogClose className="flex-1 border border-border text-foreground text-sm font-medium py-2.5 rounded-lg hover:bg-surface2 transition-colors">
              Cancel
            </DialogClose>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-brand text-white text-sm font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
