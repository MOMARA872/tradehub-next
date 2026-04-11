"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { dbListingToListing } from "@/lib/types";
import type { Category, Listing } from "@/lib/types";
import { CategoryCard } from "@/components/category/CategoryCard";
import { ListingCard } from "@/components/listing/ListingCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const ITEMS_PER_PAGE = 12;

export function BrowseContent() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category");
  const page = parseInt(searchParams.get("page") || "1", 10);

  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [category, setCategory] = useState<Category | null>(null);
  const [listingCounts, setListingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      if (!categoryId) {
        // Fetch all categories
        const { data: catRows } = await supabase
          .from("categories")
          .select("*")
          .order("name");

        const cats: Category[] = (catRows ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          icon: c.icon,
          description: c.description,
          isHot: c.is_hot,
          subcategories: c.subcategories ?? [],
        }));

        setCategories(cats);
        setCategory(null);
        setListings([]);

        // Fetch listing counts per category
        const counts: Record<string, number> = {};
        await Promise.all(
          cats.map(async (cat) => {
            const { count } = await supabase
              .from("listings")
              .select("id", { count: "exact", head: true })
              .eq("category_id", cat.id)
              .eq("status", "active");
            counts[cat.id] = count ?? 0;
          })
        );
        setListingCounts(counts);
      } else {
        // Fetch selected category
        const { data: catRow } = await supabase
          .from("categories")
          .select("*")
          .eq("id", categoryId)
          .single();

        if (catRow) {
          const cat: Category = {
            id: catRow.id,
            name: catRow.name,
            slug: catRow.slug,
            icon: catRow.icon,
            description: catRow.description,
            isHot: catRow.is_hot,
            subcategories: catRow.subcategories ?? [],
          };
          setCategory(cat);

          // Fetch paginated listings
          const from = (page - 1) * ITEMS_PER_PAGE;
          const to = from + ITEMS_PER_PAGE - 1;

          const { data: listingRows, count } = await supabase
            .from("listings")
            .select("*", { count: "exact" })
            .eq("category_id", categoryId)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .range(from, to);

          setListings((listingRows ?? []).map(dbListingToListing));
          setTotalCount(count ?? 0);
        } else {
          setCategory(null);
        }
      }

      setLoading(false);
    }

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, page]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-28 rounded-[var(--radius-md)] bg-surface2 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!categoryId) {
    const totalListings = Object.values(listingCounts).reduce((a, b) => a + b, 0);
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground mb-2">
          Browse Categories
        </h1>
        <p className="text-muted text-sm mb-8">
          Explore {categories.length} categories with {totalListings} active listings
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const count = listingCounts[cat.id] ?? 0;
            return (
              <div key={cat.id} className="relative">
                <CategoryCard category={cat} />
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-subtle">
                  {count} listing{count !== 1 ? "s" : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
        <EmptyState message="Category not found" icon="🔍" />
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/browse" className="hover:text-brand transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          All Categories
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{category.name}</span>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{category.icon}</span>
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">{category.name}</h1>
          <p className="text-sm text-muted">{category.description}</p>
        </div>
      </div>
      {category.subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 mb-8">
          <span className="px-3 py-1 text-xs rounded-full bg-brand text-white font-medium">
            All ({totalCount})
          </span>
          {category.subcategories.map((sub) => {
            const subCount = listings.filter((l) => l.subcategory === sub).length;
            return (
              <span
                key={sub}
                className="px-3 py-1 text-xs rounded-full bg-surface2 text-muted border border-border hover:border-brand/30 cursor-pointer transition-colors"
              >
                {sub} ({subCount})
              </span>
            );
          })}
        </div>
      )}
      {listings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/browse"
            searchParams={{ category: categoryId }}
          />
        </>
      ) : (
        <EmptyState message={`No listings in ${category.name} yet`} icon="📭" />
      )}
    </div>
  );
}
