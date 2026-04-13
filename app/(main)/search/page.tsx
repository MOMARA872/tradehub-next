import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchContent } from "@/components/search/SearchContent";

export const metadata: Metadata = {
  title: "Search Listings | TradeHub",
  description: "Search for items, services, and trades on TradeHub.",
};

function SearchSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <div className="h-8 w-64 bg-surface2 rounded animate-pulse mb-6" />
      <div className="flex gap-6">
        <div className="hidden lg:block w-64 shrink-0 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-surface2 rounded animate-pulse" />
          ))}
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-[var(--radius-md)] overflow-hidden">
              <div className="aspect-[4/3] bg-surface2 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-surface2 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-surface2 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}
