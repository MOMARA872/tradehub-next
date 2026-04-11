"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

export function HomeSearchBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useI18n();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex items-center max-w-lg mx-auto"
      style={{ animation: "heroFadeUp 0.6s ease-out 0.4s both" }}
    >
      <div className="relative w-full">
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
    </form>
  );
}
