import type { Listing, SearchFilters, Region } from '@/lib/types';

export function searchListings(
  listings: Listing[],
  query: string = '',
  filters: SearchFilters = {},
  region?: Region
): Listing[] {
  let results = [...listings];

  // Filter by region
  if (region && region.id !== 'all') {
    results = results.filter(l => l.city === region.name);
  }

  // Filter by category
  if (filters.categoryId) {
    results = results.filter(l => l.categoryId === filters.categoryId);
  }

  // Filter by price range
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    results = results.filter(l => {
      if (l.priceType === 'free' || l.priceType === 'trade') return false;
      if (filters.minPrice !== undefined && l.price < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && l.price > filters.maxPrice) return false;
      return true;
    });
  }

  // Filter by condition
  if (filters.condition) {
    results = results.filter(l => l.condition === filters.condition);
  }

  // Filter by price type
  if (filters.priceType) {
    results = results.filter(l => l.priceType === filters.priceType);
  }

  // Search by query
  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(
      l =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  return results;
}
