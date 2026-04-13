import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseContent } from "@/components/browse/BrowseContent";

export const metadata: Metadata = {
  title: "Browse Categories | TradeHub",
  description: "Explore all categories and listings on TradeHub — your community marketplace for buying, selling, and trading.",
};

function BrowseSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <div className="h-8 w-48 bg-surface2 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
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
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<BrowseSkeleton />}>
      <BrowseContent />
    </Suspense>
  );
}
