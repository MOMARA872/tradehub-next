"use client";

import { useAuth } from "@/hooks/useAuth";
import { REGIONS } from "@/lib/data/regions";

const PRICE_TYPES = [
  { value: "fixed", label: "Fixed Price" },
  { value: "negotiable", label: "Negotiable" },
  { value: "trade", label: "Trade" },
  { value: "free", label: "Free" },
];

interface PricingStepProps {
  priceType: string;
  price: number;
  city: string;
  zipCode: string;
  onPriceTypeChange: (value: string) => void;
  onPriceChange: (value: number) => void;
  onCityChange: (value: string) => void;
  onZipCodeChange: (value: string) => void;
}

export function PricingStep({
  priceType,
  price,
  city,
  zipCode,
  onPriceTypeChange,
  onPriceChange,
  onCityChange,
  onZipCodeChange,
}: PricingStepProps) {
  const { currentUser } = useAuth();
  const citiesFiltered = REGIONS.filter((r) => r.id !== "all");

  return (
    <div className="animate-fade-in space-y-5">
      <h2 className="font-heading font-semibold text-lg text-foreground mb-1">
        Pricing &amp; Location
      </h2>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2.5">
          Price Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRICE_TYPES.filter((pt) => {
            if (pt.value === "fixed") {
              return (
                currentUser?.tier === "pro" &&
                (currentUser?.subscriptionStatus === "active" ||
                  currentUser?.subscriptionStatus === "trialing")
              );
            }
            return true;
          }).map((pt) => (
            <button
              key={pt.value}
              type="button"
              onClick={() => onPriceTypeChange(pt.value)}
              className={`px-4 py-2.5 rounded-[var(--radius-md)] border text-sm font-medium transition-all cursor-pointer ${
                priceType === pt.value
                  ? "border-brand bg-brand/10 text-brand ring-2 ring-brand"
                  : "border-border bg-surface text-foreground hover:border-muted"
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      {(priceType === "fixed" || priceType === "negotiable") && (
        <div className="animate-fade-in">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Price ($)
          </label>
          <input
            type="number"
            value={price || ""}
            onChange={(e) => onPriceChange(Number(e.target.value))}
            placeholder="0.00"
            min={0}
            step={0.01}
            className="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-border bg-surface text-foreground text-sm placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
          />
        </div>
      )}

      <p className="text-xs text-muted mb-3">Enter a zip code, select a city, or both.</p>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Zip Code
        </label>
        <input
          type="text"
          value={zipCode}
          onChange={(e) => onZipCodeChange(e.target.value.replace(/[^0-9-]/g, "").slice(0, 10))}
          placeholder="e.g. 86301"
          className="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-border bg-surface text-foreground text-sm placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          City / Region (optional)
        </label>
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
        >
          <option value="">None</option>
          {citiesFiltered.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
