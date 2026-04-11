"use client";

import { CATEGORIES } from "@/lib/data/categories";
import { CONDITIONS } from "@/lib/data/conditions";
import type { ConditionKey, PriceType, SearchFilters } from "@/lib/types";
import { X } from "lucide-react";

interface FilterSidebarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  resultCount: number;
}

const PRICE_TYPES: { value: PriceType; label: string }[] = [
  { value: "fixed", label: "Fixed Price" },
  { value: "negotiable", label: "Negotiable" },
  { value: "trade", label: "Trade" },
  { value: "free", label: "Free" },
];

export function FilterSidebar({ filters, onFiltersChange, resultCount }: FilterSidebarProps) {
  function setFilter<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) {
    onFiltersChange({ ...filters, [key]: value });
  }

  function clearFilter(key: keyof SearchFilters) {
    const next = { ...filters };
    delete next[key];
    onFiltersChange(next);
  }

  function clearAll() {
    onFiltersChange({});
  }

  const activeCount = Object.keys(filters).filter(
    (k) => filters[k as keyof SearchFilters] !== undefined
  ).length;

  return (
    <div className="w-full lg:w-[240px] shrink-0">
      <div className="bg-card border border-border rounded-[var(--radius-md)] p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-sm text-foreground">Filters</h3>
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-brand hover:opacity-80 transition-opacity"
            >
              Clear all
            </button>
          )}
        </div>

        <p className="text-xs text-subtle mb-4">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </p>

        {/* Category */}
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Category
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {CATEGORIES.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="category"
                  checked={filters.categoryId === cat.id}
                  onChange={() => setFilter("categoryId", cat.id)}
                  className="accent-[var(--brand)]"
                />
                <span className="text-xs text-muted group-hover:text-foreground transition-colors">
                  {cat.icon} {cat.name}
                </span>
              </label>
            ))}
          </div>
          {filters.categoryId && (
            <button
              onClick={() => clearFilter("categoryId")}
              className="text-xs text-brand mt-1 flex items-center gap-0.5"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Condition */}
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Condition
          </h4>
          <div className="space-y-1">
            {(Object.entries(CONDITIONS) as [ConditionKey, typeof CONDITIONS[ConditionKey]][]).map(
              ([key, cond]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="condition"
                    checked={filters.condition === key}
                    onChange={() => setFilter("condition", key)}
                    className="accent-[var(--brand)]"
                  />
                  <span className="text-xs text-muted group-hover:text-foreground transition-colors">
                    {cond.emoji} {cond.label}
                  </span>
                </label>
              )
            )}
          </div>
          {filters.condition && (
            <button
              onClick={() => clearFilter("condition")}
              className="text-xs text-brand mt-1 flex items-center gap-0.5"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Price Type */}
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Price Type
          </h4>
          <div className="space-y-1">
            {PRICE_TYPES.map((pt) => (
              <label key={pt.value} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="priceType"
                  checked={filters.priceType === pt.value}
                  onChange={() => setFilter("priceType", pt.value)}
                  className="accent-[var(--brand)]"
                />
                <span className="text-xs text-muted group-hover:text-foreground transition-colors">
                  {pt.label}
                </span>
              </label>
            ))}
          </div>
          {filters.priceType && (
            <button
              onClick={() => clearFilter("priceType")}
              className="text-xs text-brand mt-1 flex items-center gap-0.5"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Price Range */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Price Range
          </h4>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice ?? ""}
              onChange={(e) =>
                setFilter("minPrice", e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full bg-surface2 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <span className="text-subtle text-xs">—</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice ?? ""}
              onChange={(e) =>
                setFilter("maxPrice", e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full bg-surface2 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        {/* Active Filter Pills */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border">
            {filters.categoryId && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand/10 text-brand text-[10px] rounded-full">
                {CATEGORIES.find((c) => c.id === filters.categoryId)?.name}
                <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => clearFilter("categoryId")} />
              </span>
            )}
            {filters.condition && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand/10 text-brand text-[10px] rounded-full">
                {CONDITIONS[filters.condition].label}
                <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => clearFilter("condition")} />
              </span>
            )}
            {filters.priceType && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand/10 text-brand text-[10px] rounded-full">
                {filters.priceType}
                <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => clearFilter("priceType")} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
