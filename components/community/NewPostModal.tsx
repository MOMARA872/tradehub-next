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

type Category = "announcement" | "discussion" | "tip" | "question";

interface NewPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onPostCreated: () => void;
}

export function NewPostModal({
  open,
  onOpenChange,
  userId,
  onPostCreated,
}: NewPostModalProps) {
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<Category>("discussion");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTitle("");
    setBody("");
    setCategory("discussion");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      setError("You must be logged in to post.");
      return;
    }
    if (!title.trim() || !body.trim()) {
      setError("Title and body are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase
      .from("community_posts")
      .insert({
        user_id: userId,
        title: title.trim(),
        body: body.trim(),
        category,
        is_pinned: false,
        upvotes: 0,
        downvotes: 0,
        comment_count: 0,
      });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message || "Failed to create post. Please try again.");
      return;
    }

    resetForm();
    onPostCreated();
    onOpenChange(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  const bodyRemaining = 2000 - body.length;

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
            New Post
          </DialogTitle>
          <DialogDescription className="text-xs text-muted mb-5">
            Share an announcement, discussion, tip, or question with the community.
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
                placeholder="What's on your mind?"
                maxLength={200}
                required
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="announcement">Announcement</option>
                <option value="discussion">Discussion</option>
                <option value="tip">Tip</option>
                <option value="question">Question</option>
              </select>
            </div>

            {/* Body */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Body <span className="text-red-400">*</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 2000))}
                rows={6}
                placeholder="Write your post here..."
                required
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand resize-none"
              />
              <p
                className={`text-[11px] mt-0.5 text-right ${
                  bodyRemaining < 100 ? "text-amber-400" : "text-subtle"
                }`}
              >
                {bodyRemaining} characters remaining
              </p>
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
                disabled={submitting || !title.trim() || !body.trim()}
                className="flex-1 bg-brand text-white font-semibold text-sm py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post"
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
