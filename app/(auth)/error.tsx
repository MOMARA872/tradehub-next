"use client";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h2 className="font-heading font-bold text-lg text-foreground mb-2">
          Authentication Error
        </h2>
        <p className="text-sm text-muted mb-6">
          {error.message || "Something went wrong. Please try again."}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-[var(--radius-md)] hover:bg-brand/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
