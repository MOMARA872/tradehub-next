"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState } from "@/components/common/EmptyState";
import { RequestCard } from "@/components/wanted/RequestCard";
import { NewRequestModal } from "@/components/wanted/NewRequestModal";
import { Filter, Plus } from "lucide-react";

interface WantedProfile {
  display_name: string | null;
  avatar_initials: string | null;
  profile_image: string | null;
}

interface WantedRequest {
  id: string;
  title: string;
  description: string;
  category_id: string;
  trade_type: string;
  created_at: string;
  profiles: WantedProfile | null;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

function RequestSkeleton() {
  return (
    <div className="bg-card border border-border rounded-[var(--radius-md)] p-5 animate-pulse flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="h-5 w-20 bg-surface2 rounded-full" />
        <div className="h-5 w-14 bg-surface2 rounded-full" />
      </div>
      <div className="h-5 w-3/4 bg-surface2 rounded" />
      <div className="space-y-1.5">
        <div className="h-3.5 w-full bg-surface2 rounded" />
        <div className="h-3.5 w-5/6 bg-surface2 rounded" />
      </div>
      <div className="flex items-center gap-2.5 pt-1">
        <div className="h-8 w-8 bg-surface2 rounded-full shrink-0" />
        <div className="space-y-1">
          <div className="h-3.5 w-28 bg-surface2 rounded" />
          <div className="h-3 w-16 bg-surface2 rounded" />
        </div>
      </div>
      <div className="h-8 w-full bg-surface2 rounded-lg" />
    </div>
  );
}

export default function WantedPage() {
  const supabase = createClient();
  const { currentUser, isLoggedIn } = useAuth();

  const [requests, setRequests] = useState<WantedRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name, icon")
      .order("name", { ascending: true });
    if (data) setCategories(data as Category[]);
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from("wanted_requests")
      .select("*, profiles(display_name, avatar_initials, profile_image)")
      .eq("is_public", true)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    setRequests((data as WantedRequest[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchRequests();
  }, [fetchCategories, fetchRequests]);

  const filtered =
    activeCategoryId === "all"
      ? requests
      : requests.filter((r) => r.category_id === activeCategoryId);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">
            Wanted Board
          </h1>
          <p className="text-sm text-muted mt-1">
            Browse what people are looking for, or post your own request.
          </p>
        </div>
        {isLoggedIn && currentUser && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-brand text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="h-4 w-4" />
            Post a Request
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        <Filter className="h-4 w-4 text-muted shrink-0" />
        <button
          onClick={() => setActiveCategoryId("all")}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
            activeCategoryId === "all"
              ? "bg-brand text-white border-brand"
              : "bg-surface2 text-muted border-border hover:text-foreground"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              activeCategoryId === cat.id
                ? "bg-brand text-white border-brand"
                : "bg-surface2 text-muted border-border hover:text-foreground"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <RequestSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            activeCategoryId === "all"
              ? "No requests yet. Be the first to post one!"
              : "No requests found for this category."
          }
          icon="Search"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              categories={categories}
            />
          ))}
        </div>
      )}

      {/* New Request Modal */}
      {isLoggedIn && currentUser && (
        <NewRequestModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          userId={currentUser.id}
          categories={categories}
          onCreated={fetchRequests}
        />
      )}
    </div>
  );
}
