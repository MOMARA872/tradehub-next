"use client";

import { useAuth } from "@/hooks/useAuth";
import { BLIND_REVIEWS } from "@/lib/data/blind-reviews";
import type { BlindReview } from "@/lib/data/blind-reviews";
import type { User } from "@/lib/types";
import { UserAvatar } from "@/components/user/UserAvatar";
import { StarRating } from "@/components/user/StarRating";
import { EmptyState } from "@/components/common/EmptyState";
import { truncate, timeAgo } from "@/lib/helpers/format";
import {
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

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

function ReviewSide({
  label,
  review,
  hidden,
}: {
  label: string;
  review: { rating: number; comment: string; quickTags: string[] } | null;
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

export default function ReviewsPage() {
  const { currentUser, isLoggedIn } = useAuth();

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

  const myReviews = BLIND_REVIEWS.filter(
    (r) => r.buyerId === currentUser.id || r.sellerId === currentUser.id
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Page Header */}
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

      {myReviews.length === 0 ? (
        <EmptyState
          message="No reviews yet. Complete a transaction to leave a review."
          icon="&#x2B50;"
        />
      ) : (
        <div className="space-y-6">
          {myReviews.map((review) => {
            const listing = null as ({ title: string } | null);
            const buyer = null as (User | null);
            const seller = null as (User | null);
            const isBuyer = currentUser.id === review.buyerId;
            const isSeller = currentUser.id === review.sellerId;

            const userHasSubmitted = isBuyer
              ? review.buyerReview !== null
              : review.sellerReview !== null;
            const otherHasSubmitted = isBuyer
              ? review.sellerReview !== null
              : review.buyerReview !== null;

            const isRevealed = review.status === "revealed";

            // Determine if review content should be hidden
            const showBuyerReview =
              isRevealed || (isBuyer && review.buyerReview !== null);
            const showSellerReview =
              isRevealed || (isSeller && review.sellerReview !== null);

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
                        {listing
                          ? truncate(listing.title, 60)
                          : "Unknown Listing"}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted">
                        <div className="flex items-center gap-1.5">
                          <UserAvatar user={buyer} size="sm" />
                          <span>{buyer?.displayName ?? "Unknown"}</span>
                        </div>
                        <span className="text-subtle">vs</span>
                        <div className="flex items-center gap-1.5">
                          <UserAvatar user={seller} size="sm" />
                          <span>{seller?.displayName ?? "Unknown"}</span>
                        </div>
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
                    /* Both reviews visible */
                    <div className="flex flex-col sm:flex-row gap-4">
                      <ReviewSide
                        label={`Buyer Review (${buyer?.displayName ?? "Unknown"})`}
                        review={review.buyerReview}
                        hidden={false}
                      />
                      <ReviewSide
                        label={`Seller Review (${seller?.displayName ?? "Unknown"})`}
                        review={review.sellerReview}
                        hidden={false}
                      />
                    </div>
                  ) : userHasSubmitted && !otherHasSubmitted ? (
                    /* User submitted, other hasn't */
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
                    /* User hasn't submitted */
                    <div className="flex flex-col items-center py-4">
                      {otherHasSubmitted && (
                        <div className="flex items-center gap-2 text-sm text-muted mb-4">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          The other party has already submitted their review
                        </div>
                      )}
                      <button className="bg-brand text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
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
    </div>
  );
}
