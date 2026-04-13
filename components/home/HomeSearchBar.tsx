"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

export function HomeSearchBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [zipCode, setZipCode] = useState("");
  const { t } = useI18n();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (zipCode.trim()) params.set("zip", zipCode.trim());
    if (params.toString()) {
      router.push(`/search?${params.toString()}`);
    }
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex items-center max-w-2xl mx-auto gap-2"
      style={{ animation: "heroFadeUp 0.6s ease-out 0.4s both" }}
    >
      <div className="relative flex-1">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("home.searchPlaceholder")}
          className="w-full bg-card border border-border rounded-xl pl-4 pr-12 py-3 text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand text-sm transition-all"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand text-white rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
      <div className="relative w-32 sm:w-36">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-subtle" />
        <input
          type="text"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value.replace(/[^0-9-]/g, "").slice(0, 10))}
          placeholder="Zip code"
          className="w-full bg-card border border-border rounded-xl pl-8 pr-3 py-3 text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand text-sm transition-all"
        />
      </div>
    </form>
  );
}
