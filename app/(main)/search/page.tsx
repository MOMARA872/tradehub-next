import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchContent } from "@/components/search/SearchContent";

export const metadata: Metadata = {
  title: "Search Listings | TradeHub",
  description: "Search for items, services, and trades on TradeHub.",
};

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
