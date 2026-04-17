"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

interface NewRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  categories: { id: string; name: string }[];
  onCreated: () => void;
}

type TradeType = "buy" | "trade" | "either";

export function NewRequestModal({
  open,
  onOpenChange,
  userId,
  categories,
  onCreated,
}: NewRequestModalProps) {
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tradeType, setTradeType] = useState<TradeType>("either");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategoryId("");
    setTradeType("either");
    setIsPublic(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase
      .from("wanted_requests")
      .insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        category_id: categoryId,
        trade_type: tradeType,
        is_public: isPublic,
        status: "active",
      });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message || "Failed to create request. Please try again.");
      return;
    }

    resetForm();
    onCreated();
    onOpenChange(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  const descRemaining = 500 - description.length;

  const TRADE_BUTTONS: { value: TradeType; label: string }[] = [
    { value: "buy", label: "Buy" },
    { value: "trade", label: "Trade" },
    { value: "either", label: "Either" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent
          showCloseButton={false}
          className="bg-card border border-border rounded-[var(--radius-md)] p-6 max-w-lg w-full"
        >
          <DialogTitle className="font-heading font-bold text-lg text-foreground mb-1 flex items-center gap-2">
            <Plus className="h-5 w-5 text-brand" />
            Post a Request
          </DialogTitle>
          <DialogDescription className="text-xs text-muted mb-5">
            Let the community know what you're looking for.
          </DialogDescription>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you looking for?"
                maxLength={200}
                required
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                rows={4}
                placeholder="Add details about condition, quantity, price range..."
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand resize-none"
              />
              <p
                className={`text-[11px] mt-0.5 text-right ${
                  descRemaining < 50 ? "text-amber-400" : "text-subtle"
                }`}
              >
                {descRemaining} characters remaining
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="" disabled>
                  Select a category...
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trade Type */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                I want to...
              </label>
              <div className="flex gap-2">
                {TRADE_BUTTONS.map((btn) => (
                  <button
                    key={btn.value}
                    type="button"
                    onClick={() => setTradeType(btn.value)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      tradeType === btn.value
                        ? "bg-brand text-white border-brand"
                        : "bg-surface2 text-muted border-border hover:text-foreground"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">
                Visibility
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    isPublic
                      ? "bg-brand text-white border-brand"
                      : "bg-surface2 text-muted border-border hover:text-foreground"
                  }`}
                >
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    !isPublic
                      ? "bg-brand text-white border-brand"
                      : "bg-surface2 text-muted border-border hover:text-foreground"
                  }`}
                >
                  Private
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <DialogClose className="flex-1 border border-border text-foreground text-sm font-medium py-2.5 rounded-lg hover:bg-surface2 transition-colors">
                Cancel
              </DialogClose>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !categoryId}
                className="flex-1 bg-brand text-white font-semibold text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Request"
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
