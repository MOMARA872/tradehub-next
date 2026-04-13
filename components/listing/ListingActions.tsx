"use client";

import { useState } from "react";
import { Heart, Flag, Share2 } from "lucide-react";
import { toast } from "sonner";

export function ListingActions({
  listingId,
  listingTitle,
}: {
  listingId: string;
  listingTitle: string;
}) {
  const [saved, setSaved] = useState(false);
  const [reported, setReported] = useState(false);

  function handleSave() {
    setSaved((prev) => !prev);
    toast.success(saved ? "Removed from saved" : "Listing saved!");
  }

  function handleReport() {
    if (reported) {
      toast.info("You already reported this listing");
      return;
    }
    setReported(true);
    toast.success("Thanks for reporting. We'll review this listing.");
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: listingTitle, url });
      } catch {
        // User cancelled share — no action needed
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  }

  return (
    <div className="flex items-center gap-5 mt-4">
      <button
        type="button"
        onClick={handleSave}
        className="flex items-center gap-1.5 hover:text-brand transition-colors"
      >
        <Heart
          className={`h-3.5 w-3.5 transition-colors ${saved ? "fill-brand text-brand" : ""}`}
        />
        {saved ? "saved" : "save"}
      </button>
      <button
        type="button"
        onClick={handleReport}
        className={`flex items-center gap-1.5 hover:text-brand transition-colors ${reported ? "text-muted cursor-default" : ""}`}
      >
        <Flag className="h-3.5 w-3.5" /> {reported ? "reported" : "report"}
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="flex items-center gap-1.5 hover:text-brand transition-colors"
      >
        <Share2 className="h-3.5 w-3.5" /> share
      </button>
    </div>
  );
}
