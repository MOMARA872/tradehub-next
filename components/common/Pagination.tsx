import Link from "next/link";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

export function Pagination({ currentPage, totalPages, basePath, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  function buildUrl(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  }

  const pages: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-8">
      {currentPage > 1 && (
        <Link
          href={buildUrl(currentPage - 1)}
          className="px-3 py-1.5 text-xs text-muted hover:text-foreground border border-border rounded-lg hover:bg-surface2 transition-colors"
        >
          Previous
        </Link>
      )}
      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-xs text-subtle">...</span>
        ) : (
          <Link
            key={page}
            href={buildUrl(page)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-lg border transition-colors",
              page === currentPage
                ? "bg-brand text-white border-brand font-semibold"
                : "text-muted hover:text-foreground border-border hover:bg-surface2"
            )}
          >
            {page}
          </Link>
        )
      )}
      {currentPage < totalPages && (
        <Link
          href={buildUrl(currentPage + 1)}
          className="px-3 py-1.5 text-xs text-muted hover:text-foreground border border-border rounded-lg hover:bg-surface2 transition-colors"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
