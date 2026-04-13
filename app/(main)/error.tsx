"use client";

import { AlertTriangle } from "lucide-react";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center">
      <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
      <h2 className="font-heading font-bold text-lg text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-muted mb-6 max-w-md mx-auto">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-[var(--radius-md)] hover:bg-brand/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
