# TradeHub Next — Website Optimization Design

**Date:** 2026-04-09
**Approach:** SSR-First Refactor (Approach B)
**Scope:** Homepage, Browse, Listing Detail, Search pages

## Context

TradeHub is a national marketplace (Craigslist-style) built with Next.js 16, React 19, Tailwind v4, and Zustand. Currently a frontend prototype with mock data — no backend.

**Key problems:**
- Every page is `"use client"` — zero SSR, poor SEO, large JS bundles
- Homepage loads heavy animation libraries (motion/react) for decorative effects
- No per-page metadata or Open Graph tags
- No image optimization strategy

**Constraints:**
- Staying as frontend prototype (no backend integration)
- User is open to replacing heavy animations with CSS alternatives
- Focus on homepage + 3 key pages (browse, listing detail, search)

## Section 1: Server Component Architecture

Convert key pages from fully client-rendered to Server Component shells with Client Component islands.

### Page Breakdown

| Page | Server Component (shell) | Client Island(s) |
|------|------------------------|-------------------|
| **Homepage** | Layout, sections, static text, categories grid, testimonials, CTA | Search bar, text rotation (CSS-only) |
| **Browse** | Category grid, listings grid, breadcrumbs | Subcategory filter pills |
| **Listing detail** | All listing content, seller info, similar listings | Trade offer modal, contact actions |
| **Search** | Layout shell | Search input + results (needs client state) |

### How it works with mock data

Mock data lives in `lib/data/` as static imports. Server Components can import these directly — no async fetching needed. The Zustand stores (`listingsStore`, `authStore`, etc.) only need to be accessed in Client Component islands that require reactivity (e.g., auth state, search filtering).

### Files affected

- `app/(main)/page.tsx` — split into server shell + client islands
- `app/(main)/browse/page.tsx` — extract client filter into separate component
- `app/(main)/listing/[id]/page.tsx` — keep trade modal as client island
- `app/(main)/search/page.tsx` — stays mostly client (search state), but wrap in server shell
- `components/listing/ListingCard.tsx` — remove `"use client"` (it's just a Link + Image)
- `components/category/CategoryCard.tsx` — remove `"use client"` if present

## Section 2: CSS Animation Replacements

Replace 4 heavy motion/react components with pure CSS equivalents. Removes motion/react dependency from the homepage entirely.

### Component Replacements

| Component | Current | Replacement | Savings |
|-----------|---------|-------------|---------|
| `HeroHighlight` | Mouse-tracking dot pattern via `useMotionValue` + `useMotionTemplate` | CSS `radial-gradient` background with `@keyframes` glow pulse. Drop mouse-follow effect. | ~40KB JS removed |
| `TextRotate` | 240-line component with per-character staggered spring animations, `AnimatePresence` | CSS `@keyframes rotateWord` cycling through words. Single `<span>` swapping text via opacity + translateY. ~20 lines of CSS. | 240 lines -> 20 lines CSS |
| `StackedCardsInteraction` | Motion spring animations on hover state changes | CSS `transform` + `transition` on `:hover`. Fan-out via `translateX()` + `rotate()` with `cubic-bezier` easing. | Motion springs -> CSS transition |
| `TestimonialsColumn` | Infinite `translateY(-50%)` animation via motion | CSS `@keyframes marquee` with `linear infinite`. Classic CSS-only marquee pattern. Duplicate children for seamless loop. | Motion -> CSS keyframes |

### Files affected

- `components/ui/hero-highlight.tsx` — rewrite to CSS-only (can become Server Component)
- `components/ui/text-rotate.tsx` — replace with CSS text rotator (tiny client component for interval, or pure CSS)
- `components/ui/stacked-cards-interaction.tsx` — rewrite to CSS-only
- `components/ui/testimonials-columns-1.tsx` — rewrite to CSS-only (can become Server Component)
- `app/(main)/page.tsx` — remove dynamic imports for these components, use direct imports

### Design validated

A demo of all 4 CSS replacements was reviewed and approved by the user. The visual quality matches the current motion-based animations.

## Section 3: SEO & Metadata

Add per-page metadata using Next.js `generateMetadata` (requires Server Components from Section 1).

### Per-page metadata

- **Root layout** (`app/layout.tsx`): Add `metadataBase` URL
- **Homepage**: Title "TradeHub - Buy, Sell, Trade, Connect", description, OG image
- **Browse**: Dynamic title based on category — `"Electronics | TradeHub"` or `"Browse Categories | TradeHub"`
- **Listing detail**: Dynamic from listing data — `"Vintage Road Bike in Prescott | TradeHub"`, description from listing, OG image from first photo
- **Search**: Dynamic with query — `"Search: road bike | TradeHub"`

### Static SEO files

- `public/robots.txt` — allow all crawlers, point to sitemap
- `public/sitemap.xml` — static sitemap covering main routes (homepage, browse, categories). Listing-level sitemap deferred until real backend exists.

## Section 4: Image Optimization

Optimize `next/image` usage across key pages.

### Changes

- **Above-the-fold images**: Add `priority` prop to hero area images and first row of featured listings (prevents lazy-load delay on LCP)
- **`sizes` attributes**: Ensure all `<Image>` tags have `sizes` matching their grid layout breakpoints
- **Below-the-fold images**: Explicit `loading="lazy"` for testimonial avatars, recent listings
- **`next.config.ts`**: Configure `remotePatterns` for `images.unsplash.com` and `placehold.co` domains

### Files affected

- `next.config.ts` — add `images.remotePatterns`
- `app/(main)/page.tsx` — priority on featured listing images
- `components/listing/ListingCard.tsx` — verify sizes prop
- `components/ui/testimonials-columns-1.tsx` — lazy loading on avatars

## Section 5: Lazy Loading Below-the-Fold Sections

Defer rendering/hydration of below-the-fold homepage sections until they scroll into view.

### Strategy

- **Immediate render**: Hero section, featured listings (above the fold)
- **Deferred render**: Stacked cards, categories, recent listings, how-it-works, testimonials, CTA
- **Implementation**: Small `useInView` hook using native `IntersectionObserver` API — no new dependencies
- Pairs with Server Components: server sends full HTML shell, client islands hydrate lazily

### Files affected

- New: `hooks/useInView.ts` — simple IntersectionObserver wrapper (~15 lines)
- `app/(main)/page.tsx` — wrap below-the-fold sections

## Out of Scope

- Backend/API integration
- Routes beyond homepage, browse, listing detail, search
- PWA setup
- Lighthouse-driven micro-optimizations (CLS, FID targets)
- Route-level code splitting strategy (premature for prototype)

## Expected Impact

| Metric | Before | After (estimated) |
|--------|--------|-------------------|
| Homepage JS bundle | Heavy (motion + all components) | Minimal (CSS animations, tiny client islands) |
| SSR | None | Full SSR on 4 key pages |
| SEO | Single generic title | Per-page dynamic metadata + OG tags |
| LCP | Delayed by client-side rendering | Improved via SSR + image priority |
| Motion dependency on homepage | Required | Eliminated |
