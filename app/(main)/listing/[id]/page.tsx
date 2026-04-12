import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { REVIEWS } from "@/lib/data/reviews";
import { CONDITIONS } from "@/lib/data/conditions";
import { dbListingToListing, dbProfileToUser } from "@/lib/types";
import { formatPrice, formatDate, timeAgo } from "@/lib/helpers/format";
import { UserAvatar } from "@/components/user/UserAvatar";
import { StarRating } from "@/components/user/StarRating";
import { TrustBadge } from "@/components/user/TrustBadge";
import { ListingCard } from "@/components/listing/ListingCard";
import { EmptyState } from "@/components/common/EmptyState";
import { PhotoGallery } from "@/components/listing/PhotoGallery";
import { OfferButton } from "@/components/listing/OfferButton";
import { MessageSellerButton } from "@/components/listing/MessageSellerButton";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Eye,
  Tag,

  Shield,
  CheckCircle,
  Heart,
  Flag,
  Share2,
} from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("title, city, description, photos")
    .eq("id", id)
    .single();
  if (!listing) return { title: "Listing Not Found | TradeHub" };
  return {
    title: `${listing.title} in ${listing.city} | TradeHub`,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: listing.title,
      description: listing.description.slice(0, 160),
      images: listing.photos.length > 0 ? [listing.photos[0]] : undefined,
    },
  };
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listingRow } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!listingRow) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <EmptyState message="Listing not found" icon="🔍" />
      </div>
    );
  }

  const listing = dbListingToListing(listingRow);

  const [
    { data: sellerRow },
    { data: category },
    { data: offerRows },
    { data: similarRows },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", listingRow.user_id).single(),
    supabase.from("categories").select("*").eq("id", listingRow.category_id).single(),
    supabase
      .from("offers")
      .select("*, profiles(display_name, avatar_initials)")
      .eq("listing_id", id),
    supabase
      .from("listings")
      .select("*")
      .eq("category_id", listingRow.category_id)
      .neq("id", id)
      .eq("status", "active")
      .limit(4),
  ]);

  const seller = sellerRow ? dbProfileToUser(sellerRow) : null;
  const offers = offerRows ?? [];
  const similarListings = (similarRows ?? []).map(dbListingToListing);

  const condition = CONDITIONS[listing.condition];
  const sellerReviews = seller ? REVIEWS.filter((r) => r.revieweeId === seller.id) : [];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/browse" className="hover:text-brand transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Browse
        </Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/browse?category=${category.id}`} className="hover:text-brand transition-colors">
              {category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <PhotoGallery photos={listing.photos} title={listing.title} condition={listing.condition} />

          <div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-2">
              {listing.title}
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-heading font-bold text-2xl text-brand">
                {formatPrice(listing.price, listing.priceType)}
              </span>
              {condition && (
                <span
                  className="px-2 py-0.5 rounded-md text-xs font-semibold text-white"
                  style={{ backgroundColor: condition.color }}
                >
                  {condition.emoji} {condition.label}
                </span>
              )}
              {listing.priceType === "negotiable" && (
                <span className="text-xs text-warning font-medium">Negotiable</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-muted">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {listing.city}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(listing.createdAt)}</span>
            {category && (
              <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {category.name} &rsaquo; {listing.subcategory}</span>
            )}
          </div>

          <div>
            <h2 className="font-heading font-semibold text-sm text-foreground mb-2">Description</h2>
            <p className="text-sm text-muted leading-relaxed">{listing.description}</p>
            {listing.conditionNotes && (
              <p className="text-xs text-subtle mt-2 italic">Note: {listing.conditionNotes}</p>
            )}
          </div>

          {listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {listing.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="px-2.5 py-1 text-[10px] rounded-full bg-surface2 text-muted border border-border hover:border-brand/30 hover:text-brand transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Post metadata footer (Craigslist-style) */}
          <div className="border-t border-border pt-4 text-xs text-muted">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-subtle">listing id:</dt>
              <dd className="text-foreground font-mono">{listing.id.slice(0, 8)}</dd>
              <dt className="text-subtle">posted:</dt>
              <dd className="text-foreground">{formatDate(listing.createdAt)}</dd>
              <dt className="text-subtle">views:</dt>
              <dd className="text-foreground flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {listingRow.views_count ?? 0}
              </dd>
            </dl>
            <div className="flex items-center gap-5 mt-4">
              <button
                type="button"
                className="flex items-center gap-1.5 hover:text-brand transition-colors"
              >
                <Heart className="h-3.5 w-3.5" /> save
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 hover:text-brand transition-colors"
              >
                <Flag className="h-3.5 w-3.5" /> report
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 hover:text-brand transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" /> share
              </button>
            </div>
          </div>

          {offers.length > 0 && (
            <div>
              <h2 className="font-heading font-semibold text-sm text-foreground mb-3">Offers ({offers.length})</h2>
              <div className="space-y-3">
                {offers.map((offer) => {
                  // profiles is a joined object from Supabase
                  const buyer = offer.profiles as { display_name: string; avatar_initials: string } | null;
                  return (
                    <div key={offer.id} className="bg-card border border-border rounded-[var(--radius-md)] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            user={buyer ? { id: offer.buyer_id, displayName: buyer.display_name, avatarInitials: buyer.avatar_initials } : null}
                            size="sm"
                          />
                          <div>
                            <p className="text-xs font-medium text-foreground">{buyer?.display_name || "Unknown"}</p>
                            <p className="text-[10px] text-subtle">{timeAgo(offer.created_at)}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                          offer.status === "accepted" ? "bg-success/10 text-success"
                            : offer.status === "declined" ? "bg-danger/10 text-danger"
                            : offer.status === "countered" ? "bg-warning/10 text-warning"
                            : "bg-purple/10 text-purple"
                        }`}>
                          {offer.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {offer.offer_amount > 0 ? `$${offer.offer_amount}` : offer.trade_description}
                      </p>
                      {offer.message && (
                        <p className="text-xs text-muted mt-1 italic">&ldquo;{offer.message}&rdquo;</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sellerReviews.length > 0 && (
            <div>
              <h2 className="font-heading font-semibold text-sm text-foreground mb-3">
                Reviews for {seller?.displayName} ({sellerReviews.length})
              </h2>
              <div className="space-y-3">
                {sellerReviews.slice(0, 4).map((review) => (
                  <div key={review.id} className="bg-card border border-border rounded-[var(--radius-md)] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <UserAvatar user={null} size="sm" />
                        <div>
                          <p className="text-xs font-medium text-foreground">Reviewer</p>
                          <p className="text-[10px] text-subtle">as {review.reviewerRole}</p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{review.comment}</p>
                    {review.quickTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {review.quickTags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-success/10 text-success">{tag}</span>
                        ))}
                      </div>
                    )}
                    {review.sellerReply && (
                      <div className="mt-2 pl-3 border-l-2 border-brand/30">
                        <p className="text-[10px] text-subtle">Seller reply:</p>
                        <p className="text-xs text-muted">{review.sellerReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-[var(--radius-md)] p-5 sticky top-20">
            <p className="font-heading font-bold text-2xl text-brand mb-4">
              {formatPrice(listing.price, listing.priceType)}
            </p>
            <OfferButton listing={listingRow} />
            <MessageSellerButton
              listingId={listing.id}
              sellerId={listing.userId}
              listingTitle={listing.title}
            />
          </div>

          {seller && (
            <div className="bg-card border border-border rounded-[var(--radius-md)] p-5">
              <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Seller</h3>
              <Link href={`/profile/${seller.id}`} className="flex items-center gap-3 group">
                <UserAvatar user={seller} size="md" />
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-brand transition-colors flex items-center gap-1">
                    {seller.displayName}
                    {seller.isVerified && <CheckCircle className="h-3.5 w-3.5 text-success" />}
                  </p>
                  <p className="text-xs text-subtle">{seller.city}</p>
                </div>
              </Link>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Rating</span>
                  <span className="flex items-center gap-1"><StarRating rating={seller.ratingAvg} /><span className="text-subtle">({seller.reviewCount})</span></span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Trust</span>
                  <TrustBadge score={seller.trustScore} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Response</span>
                  <span className="text-foreground font-medium">{seller.responseRate}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Member since</span>
                  <span className="text-foreground">{formatDate(seller.joinedAt)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Listings</span>
                  <span className="text-foreground">{seller.listingCount}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-1 text-xs text-muted">
                <Shield className="h-3.5 w-3.5" /><span>Protected by TradeHub</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {similarListings.length > 0 && (
        <div className="mt-12">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">Similar Listings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {similarListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
