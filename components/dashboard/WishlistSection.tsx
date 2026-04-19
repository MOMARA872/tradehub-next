"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart, Plus, Trash2, CheckCircle, Loader2, Search } from "lucide-react";
import { CategoryIcon } from "@/lib/helpers/categoryIcon";
import { timeAgo } from "@/lib/helpers/format";
import { NewRequestModal } from "@/components/wanted/NewRequestModal";

interface WantedRequest {
  id: string;
  title: string;
  description: string;
  category_id: string;
  trade_type: string;
  is_public: boolean;
  status: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const TRADE_LABELS: Record<string, { label: string; classes: string }> = {
  buy: { label: "Buy", classes: "bg-emerald-500/15 text-emerald-400" },
  trade: { label: "Trade", classes: "bg-purple-500/15 text-purple-400" },
  either: { label: "Either", classes: "bg-blue-500/15 text-blue-400" },
};

export function WishlistSection({ userId }: { userId: string }) {
  const supabase = createClient();
  const [requests, setRequests] = useState<WantedRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    const [{ data: reqs }, { data: cats }] = await Promise.all([
      supabase
        .from("wanted_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name, icon"),
    ]);
    setRequests((reqs as WantedRequest[]) ?? []);
    setCategories((cats as Category[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleFulfill(id: string) {
    setActionLoading(id);
    await supabase
      .from("wanted_requests")
      .update({ status: "fulfilled" })
      .eq("id", id);
    await fetchRequests();
    setActionLoading(null);
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    await supabase.from("wanted_requests").delete().eq("id", id);
    await fetchRequests();
    setActionLoading(null);
  }

  const activeRequests = requests.filter((r) => r.status === "active");
  const fulfilledRequests = requests.filter((r) => r.status === "fulfilled");

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-semibold text-lg text-foreground flex items-center gap-2">
          <Heart className="h-5 w-5 text-brand" />
          My Wishlist
        </h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 bg-brand text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Item
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted" />
        </div>
      ) : activeRequests.length === 0 && fulfilledRequests.length === 0 ? (
        <div className="bg-card border border-border rounded-[var(--radius-md)] p-8 text-center">
          <div className="flex justify-center mb-3">
            <Search className="h-8 w-8 text-muted" />
          </div>
          <p className="text-sm text-muted mb-3">
            No items in your wishlist yet.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="text-brand text-sm font-semibold hover:opacity-80 transition-opacity"
          >
            Add something you&apos;re looking for
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {activeRequests.map((req) => {
            const cat = categories.find((c) => c.id === req.category_id);
            const trade = TRADE_LABELS[req.trade_type] || TRADE_LABELS.either;

            return (
              <div
                key={req.id}
                className="bg-card border border-border rounded-[var(--radius-md)] p-4 flex items-start gap-3"
              >
                <div className="shrink-0 mt-0.5">
                  {cat && (
                    <CategoryIcon
                      name={cat.icon}
                      className="h-5 w-5 text-muted"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground">
                      {req.title}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${trade.classes}`}
                    >
                      {trade.label}
                    </span>
                    {!req.is_public && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-surface2 text-muted">
                        Private
                      </span>
                    )}
                  </div>
                  {req.description && (
                    <p className="text-xs text-muted mt-1 line-clamp-1">
                      {req.description}
                    </p>
                  )}
                  <p className="text-[10px] text-subtle mt-1">
                    {cat?.name} &middot; Added {timeAgo(req.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {actionLoading === req.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted" />
                  ) : (
                    <>
                      <button
                        onClick={() => handleFulfill(req.id)}
                        title="Mark as found"
                        className="p-1.5 text-muted hover:text-emerald-500 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(req.id)}
                        title="Remove"
                        className="p-1.5 text-muted hover:text-danger transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {fulfilledRequests.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-subtle mb-2">
                Found ({fulfilledRequests.length})
              </p>
              {fulfilledRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-card border border-border rounded-[var(--radius-md)] p-3 flex items-center gap-3 opacity-60"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-xs text-muted line-through flex-1">
                    {req.title}
                  </span>
                  <button
                    onClick={() => handleDelete(req.id)}
                    className="p-1 text-muted hover:text-danger transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <NewRequestModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        userId={userId}
        categories={categories}
        onCreated={fetchRequests}
      />
    </section>
  );
}
