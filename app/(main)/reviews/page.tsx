"use client";

import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { dbBlindReviewToBlindReview } from "@/lib/types";
import type { BlindReview, BlindReviewEntry } from "@/lib/data/blind-reviews";
import { StarRating } from "@/components/user/StarRating";
import { EmptyState } from "@/components/common/EmptyState";
import { truncate, timeAgo } from "@/lib/helpers/format";
import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  Loader2,
  X,
} from "lucide-react";
import Link from "next/link";

// --- Quick tag options ---
const BUYER_TAGS = [
  "Fast Shipping",
  "As Described",
  "Great Communication",
  "Well Packaged",
  "Fair Price",
  "Would Buy Again",
];
const SELLER_TAGS = [
  "Quick Responder",
  "Easy to Work With",
  "Reliable",
  "Punctual",
  "Friendly",
  "Smooth Transaction",
];

// --- Status badge ---
function StatusBadge({ status }: { status: BlindReview["status"] }) {
  const config: Record<
    BlindReview["status"],
    { label: string; classes: string; Icon: typeof CheckCircle }
  > = {
    revealed: {
      label: "Revealed",
      classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
      Icon: Eye,
    },
    awaiting_seller: {
      label: "Awaiting Seller",
      classes: "bg-amber-500/15 text-amber-400 border-amber-500/25",
      Icon: Clock,
    },
    awaiting_buyer: {
      label: "Awaiting Buyer",
      classes: "bg-amber-500/15 text-amber-400 border-amber-500/25",
      Icon: Clock,
    },
    awaiting_both: {
      label: "Awaiting Both",
      classes: "bg-purple-500/15 text-purple-400 border-purple-500/25",
      Icon: EyeOff,
    },
  };
  const { label, classes, Icon } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${classes}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// --- Review display side ---
function ReviewSide({
  label,
  review,
  hidden,
}: {
  label: string;
  review: BlindReviewEntry | null;
  hidden: boolean;
}) {
  if (hidden) {
    return (
      <div className="flex-1 bg-surface2 rounded-[var(--radius-md)] p-4 border border-border">
        <p className="text-xs font-semibold text-muted mb-2">{label}</p>
        <div className="flex items-center gap-2 text-muted opacity-60">
          <EyeOff className="h-4 w-4" />
          <span className="text-sm">Hidden until both review</span>
        </div>
      </div>
    );
  }
  if (!review) {
    return (
      <div className="flex-1 bg-surface2 rounded-[var(--radius-md)] p-4 border border-border">
        <p className="text-xs font-semibold text-muted mb-2">{label}</p>
        <p className="text-sm text-subtle italic">Not yet submitted</p>
      </div>
    );
  }
  return (
    <div className="flex-1 bg-surface2 rounded-[var(--radius-md)] p-4 border border-border">
      <p className="text-xs font-semibold text-muted mb-2">{label}</p>
      <div className="mb-2">
        <StarRating rating={review.rating} />
      </div>
      <p className="text-sm text-foreground mb-3">{review.comment}</p>
      {review.quickTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.quickTags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] bg-brand/10 text-brand px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Write Review Modal ---
function WriteReviewModal({
  reviewId,
  role,
  onClose,
  onSubmitted,
}: {
  reviewId: string;
  role: "buyer" | "seller";
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [conditionMatch, setConditionMatch] = useState<"yes" | "no">("yes");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const tagOptions = role === "buyer" ? BUYER_TAGS : SELLER_TAGS;

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSubmit() {
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (!comment.trim()) {
      setError("Please write a comment.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const supabase = createClient();
      const reviewData: BlindReviewEntry = {
        rating,
        comment: comment.trim(),
        quickTags: selectedTags,
        conditionMatch,
        submittedAt: new Date().toISOString(),
      };

      const field = role === "buyer" ? "buyer_review" : "seller_review";
      const { error: updateErr } = await supabase
        .from("blind_reviews")
        .update({ [field]: reviewData })
        .eq("id", reviewId);

      if (updateErr) throw new Error(updateErr.message);

      onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-[var(--radius-lg)] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="font-heading font-bold text-lg text-foreground mb-1">
          Write Your Review
        </h2>
        <p className="text-xs text-muted mb-5">
          Your review will be hidden until the other party submits theirs.
        </p>

        <div className="space-y-5">
          {/* Star Rating */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-2">
              Rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-7 w-7 ${
                      n <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-border"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="How was your experience?"
              maxLength={500}
              className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand resize-none"
            />
            <p className="text-[10px] text-subtle mt-1">
              {comment.length}/500
            </p>
          </div>

          {/* Quick Tags */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-2">
              Quick Tags (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-brand/15 text-brand border-brand/30"
                      : "bg-surface2 text-muted border-border hover:text-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Condition Match */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-2">
              Did the item match the described condition?
            </label>
            <div className="flex gap-3">
              {(["yes", "no"] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setConditionMatch(val)}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    conditionMatch === val
                      ? "bg-brand/10 text-brand border-brand"
                      : "bg-surface2 text-muted border-border"
                  }`}
                >
                  {val === "yes" ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-brand text-white font-semibold text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Reviews Page ---
export default function ReviewsPage() {
  const { currentUser, isLoggedIn } = useAuth();
  const supabase = createClient();

  const [reviews, setReviews] = useState<BlindReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [writeModalReview, setWriteModalReview] = useState<{
    id: string;
    role: "buyer" | "seller";
  } | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);

    const { data } = await supabase
      .from("blind_reviews")
      .select(
        `*, listings:listing_id(title), buyer:buyer_id(display_name, avatar_initials, profile_image), seller:seller_id(display_name, avatar_initials, profile_image)`,
      )
      .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
      .order("created_at", { ascending: false });

    if (data) {
      setReviews(data.map(dbBlindReviewToBlindReview));
    }
    setLoading(false);
  }, [currentUser, supabase]);

  useEffect(() => {
    if (currentUser) fetchReviews();
  }, [currentUser, fetchReviews]);

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in">
        <div className="text-5xl mb-4">&#x1f512;</div>
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
          Sign in to view your reviews
        </h1>
        <p className="text-muted text-sm mb-6">
          You need to be logged in to access the blind review system.
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

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <h1 className="font-heading font-bold text-2xl text-foreground mb-4">
        Blind Reviews
      </h1>

      {/* Info Banner */}
      <div className="bg-brand/10 border border-brand/20 rounded-[var(--radius-md)] p-4 mb-8 flex items-start gap-3">
        <EyeOff className="h-5 w-5 text-brand shrink-0 mt-0.5" />
        <p className="text-sm text-foreground">
          Both parties submit reviews independently. Reviews are revealed only
          after both sides have submitted, ensuring honest feedback.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 text-muted animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          message="No reviews yet. Complete a transaction to leave a review."
          icon="&#x2B50;"
        />
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => {
            const isBuyer = currentUser.id === review.buyerId;
            const userHasSubmitted = isBuyer
              ? review.buyerReview !== null
              : review.sellerReview !== null;
            const otherHasSubmitted = isBuyer
              ? review.sellerReview !== null
              : review.buyerReview !== null;
            const isRevealed = review.status === "revealed";

            const hasConditionMismatch =
              isRevealed &&
              (review.buyerReview?.conditionMatch === "no" ||
                review.sellerReview?.conditionMatch === "no");

            return (
              <div
                key={review.id}
                className="bg-card border border-border rounded-[var(--radius-md)] overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-border">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-heading font-semibold text-foreground text-base mb-1">
                        {review.listingTitle
                          ? truncate(review.listingTitle, 60)
                          : "Unknown Listing"}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted">
                        <span>{review.buyerName ?? "Buyer"}</span>
                        <span className="text-subtle">vs</span>
                        <span>{review.sellerName ?? "Seller"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasConditionMismatch && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/25 px-2.5 py-1 rounded-full">
                          <AlertTriangle className="h-3 w-3" />
                          Condition Mismatch
                        </span>
                      )}
                      <StatusBadge status={review.status} />
                    </div>
                  </div>
                  {review.revealedAt && (
                    <p className="text-xs text-subtle mt-2">
                      Revealed {timeAgo(review.revealedAt)}
                    </p>
                  )}
                </div>

                {/* Review Content */}
                <div className="p-5">
                  {isRevealed ? (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <ReviewSide
                        label={`Buyer Review (${review.buyerName ?? "Unknown"})`}
                        review={review.buyerReview}
                        hidden={false}
                      />
                      <ReviewSide
                        label={`Seller Review (${review.sellerName ?? "Unknown"})`}
                        review={review.sellerReview}
                        hidden={false}
                      />
                    </div>
                  ) : userHasSubmitted && !otherHasSubmitted ? (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <ReviewSide
                        label="Your Review"
                        review={
                          isBuyer ? review.buyerReview : review.sellerReview
                        }
                        hidden={false}
                      />
                      <ReviewSide
                        label="Other Party's Review"
                        review={null}
                        hidden={true}
                      />
                    </div>
                  ) : !userHasSubmitted ? (
                    <div className="flex flex-col items-center py-4">
                      {otherHasSubmitted && (
                        <div className="flex items-center gap-2 text-sm text-muted mb-4">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          The other party has already submitted their review
                        </div>
                      )}
                      <button
                        onClick={() =>
                          setWriteModalReview({
                            id: review.id,
                            role: isBuyer ? "buyer" : "seller",
                          })
                        }
                        className="bg-brand text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Write Review
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Write Review Modal */}
      {writeModalReview && (
        <WriteReviewModal
          reviewId={writeModalReview.id}
          role={writeModalReview.role}
          onClose={() => setWriteModalReview(null)}
          onSubmitted={fetchReviews}
        />
      )}
    </div>
  );
}
