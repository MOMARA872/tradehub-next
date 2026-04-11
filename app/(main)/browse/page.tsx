import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseContent } from "@/components/browse/BrowseContent";

export const metadata: Metadata = {
  title: "Browse Categories | TradeHub",
  description: "Explore all categories and listings on TradeHub — your community marketplace for buying, selling, and trading.",
};

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseContent />
    </Suspense>
  );
}
