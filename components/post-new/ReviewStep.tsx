"use client";

import { formatPrice } from "@/lib/helpers/format";
import { CONDITIONS } from "@/lib/data/conditions";
import { REGIONS } from "@/lib/data/regions";
import type { Category, ConditionKey } from "@/lib/types";

interface ReviewStepProps {
  selectedCategory: string;
  selectedSubcategory: string;
  customSubcategory: string;
  categories: Category[];
  photos: string[];
  title: string;
  description: string;
  condition: ConditionKey | "";
  conditionNotes: string;
  tags: string[];
  priceType: string;
  price: number;
  city: string;
  onGoToStep: (step: number) => void;
}

export function ReviewStep({
  selectedCategory,
  selectedSubcategory,
  customSubcategory,
  categories,
  photos,
  title,
  description,
  condition,
  conditionNotes,
  tags,
  priceType,
  price,
  city,
  onGoToStep,
}: ReviewStepProps) {
  const categoryData = categories.find((c) => c.id === selectedCategory);
  const conditionData = condition ? CONDITIONS[condition] : null;
  const cityData = REGIONS.find((r) => r.id === city);

  return (
    <div className="animate-fade-in">
      <h2 className="font-heading font-semibold text-lg text-foreground mb-5">
        Review Your Listing
      </h2>

      <div className="bg-card border border-border rounded-[var(--radius-md)] divide-y divide-border">
        {/* Category */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs text-subtle uppercase tracking-wide mb-0.5">
              Category
            </p>
            <p className="text-sm text-foreground font-medium">
              {categoryData?.icon} {categoryData?.name}
              {selectedSubcategory && (
                <span className="text-muted">
                  {" "}
                  /{" "}
                  {selectedSubcategory === "__other__"
                    ? customSubcategory
                    : selectedSubcategory}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(1)}
            className="text-xs text-brand font-medium hover:underline cursor-pointer"
          >
            Edit
          </button>
        </div>

        {/* Photos */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs text-subtle uppercase tracking-wide mb-0.5">
              Photos
            </p>
            <p className="text-sm text-foreground font-medium">
              {photos.length} photo{photos.length !== 1 ? "s" : ""} uploaded
            </p>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(2)}
            className="text-xs text-brand font-medium hover:underline cursor-pointer"
          >
            Edit
          </button>
        </div>

        {/* Title & Description */}
        <div className="flex items-start justify-between px-5 py-4">
          <div className="flex-1 min-w-0 mr-4">
            <p className="text-xs text-subtle uppercase tracking-wide mb-0.5">
              Title
            </p>
            <p className="text-sm text-foreground font-medium">
              {title || <span className="text-subtle italic">Not set</span>}
            </p>
            <p className="text-xs text-subtle uppercase tracking-wide mt-3 mb-0.5">
              Description
            </p>
            <p className="text-sm text-muted truncate">
              {description
                ? description.length > 120
                  ? description.substring(0, 120) + "..."
                  : description
                : "Not set"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(3)}
            className="text-xs text-brand font-medium hover:underline cursor-pointer flex-shrink-0"
          >
            Edit
          </button>
        </div>

        {/* Condition */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs text-subtle uppercase tracking-wide mb-0.5">
              Condition
            </p>
            <p className="text-sm text-foreground font-medium">
              {conditionData ? (
                <>
                  {conditionData.emoji} {conditionData.label}
                  {conditionNotes && (
                    <span className="text-muted font-normal">
                      {" "}
                      — {conditionNotes}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-subtle italic">Not set</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(3)}
            className="text-xs text-brand font-medium hover:underline cursor-pointer"
          >
            Edit
          </button>
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs text-subtle uppercase tracking-wide mb-0.5">
              Price
            </p>
            <p className="text-sm text-foreground font-medium">
              {priceType === "free" || priceType === "trade"
                ? formatPrice(0, priceType as "fixed" | "free" | "trade" | "negotiable")
                : price > 0
                ? `${formatPrice(price, priceType as "fixed" | "free" | "trade" | "negotiable")}${
                    priceType === "negotiable" ? " (Negotiable)" : ""
                  }`
                : "Not set"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(4)}
            className="text-xs text-brand font-medium hover:underline cursor-pointer"
          >
            Edit
          </button>
        </div>

        {/* City */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs text-subtle uppercase tracking-wide mb-0.5">
              Location
            </p>
            <p className="text-sm text-foreground font-medium">
              {cityData?.name || (
                <span className="text-subtle italic">Not set</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(4)}
            className="text-xs text-brand font-medium hover:underline cursor-pointer"
          >
            Edit
          </button>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex items-start justify-between px-5 py-4">
            <div>
              <p className="text-xs text-subtle uppercase tracking-wide mb-1.5">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-block bg-brand/10 text-brand text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(3)}
              className="text-xs text-brand font-medium hover:underline cursor-pointer flex-shrink-0"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
