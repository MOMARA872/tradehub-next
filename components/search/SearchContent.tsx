"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { dbListingToListing } from "@/lib/types";
import type { Listing, SearchFilters } from "@/lib/types";
import { ListingCard } from "@/components/listing/ListingCard";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { Search, LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";

type SortOption = "relevant" | "newest" | "price-low" | "price-high";

const ITEMS_PER_PAGE = 12;

export function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);

  const supabase = createClient();

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({
    categoryId: initialCategory,
  });
  const [sort, setSort] = useState<SortOption>("relevant");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [results, setResults] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchResults = useCallback(async () => {
    const q = searchParams.get("q") || "";
    const currentPage = parseInt(searchParams.get("page") || "1", 10);
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    setLoading(true);

    let queryBuilder = supabase
      .from("listings")
      .select("*", { count: "exact" })
      .eq("status", "active");

    if (q) {
      queryBuilder = queryBuilder.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    if (filters.categoryId) {
      queryBuilder = queryBuilder.eq("category_id", filters.categoryId);
    }
    if (filters.condition) {
      queryBuilder = queryBuilder.eq("condition", filters.condition);
    }
    if (filters.priceType) {
      queryBuilder = queryBuilder.eq("price_type", filters.priceType);
    }
    if (filters.minPrice !== undefined) {
      queryBuilder = queryBuilder.gte("price", filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      queryBuilder = queryBuilder.lte("price", filters.maxPrice);
    }

    // Sort
    switch (sort) {
      case "newest":
        queryBuilder = queryBuilder.order("created_at", { ascending: false });
        break;
      case "price-low":
        queryBuilder = queryBuilder.order("price", { ascending: true });
        break;
      case "price-high":
        queryBuilder = queryBuilder.order("price", { ascending: false });
        break;
      default:
        queryBuilder = queryBuilder.order("created_at", { ascending: false });
    }

    queryBuilder = queryBuilder.range(from, to);

    const { data, count } = await queryBuilder;

    setResults((data ?? []).map(dbListingToListing));
    setTotalCount(count ?? 0);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, filters, sort]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }, [query, router]);

  const handleClearQuery = useCallback(() => setQuery(""), []);
  const handleToggleMobileFilters = useCallback(() => setShowMobileFilters(v => !v), []);
  const handleCloseMobileFilters = useCallback(() => setShowMobileFilters(false), []);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const currentSearchParams: Record<string, string> = {};
  const q = searchParams.get("q");
  if (q) currentSearchParams.q = q;
  if (filters.categoryId) currentSearchParams.category = filters.categoryId;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search listings..."
            className="w-full bg-card border border-border rounded-xl pl-4 pr-20 py-3 text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand text-sm transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={handleClearQuery}
              className="absolute right-14 top-1/2 -translate-y-1/2 text-subtle hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand text-white rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted">
          {loading ? "Searching..." : `${totalCount} result${totalCount !== 1 ? "s" : ""}`}
          {q && (
            <>
              {" "}for <span className="text-foreground font-medium">&ldquo;{q}&rdquo;</span>
            </>
          )}
        </p>
        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            onClick={handleToggleMobileFilters}
            className="lg:hidden flex items-center gap-1 text-xs text-muted hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="relevant">Most Relevant</option>
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>

          {/* View Toggle */}
          <div className="hidden sm:flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-brand text-white" : "text-muted hover:text-foreground"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-brand text-white" : "text-muted hover:text-foreground"}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Sidebar (desktop) */}
        <div className="hidden lg:block">
          <FilterSidebar
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={totalCount}
          />
        </div>

        {/* Mobile Filters */}
        {showMobileFilters && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={handleCloseMobileFilters}>
            <div className="absolute right-0 top-0 h-full w-72 bg-surface p-4 overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-foreground">Filters</h3>
                <button onClick={handleCloseMobileFilters}><X className="h-5 w-5 text-foreground" /></button>
              </div>
              <FilterSidebar
                filters={filters}
                onFiltersChange={setFilters}
                resultCount={totalCount}
              />
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 rounded-[var(--radius-md)] bg-surface2 animate-pulse" />
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                    : "flex flex-col gap-3"
                }
              >
                {results.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              <Pagination
                currentPage={parseInt(searchParams.get("page") || "1", 10)}
                totalPages={totalPages}
                basePath="/search"
                searchParams={currentSearchParams}
              />
            </>
          ) : (
            <EmptyState
              message={q ? `No results for "${q}"` : "No listings match your filters"}
              icon="🔍"
            />
          )}
        </div>
      </div>
    </div>
  );
}
