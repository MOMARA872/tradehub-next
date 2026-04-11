# Website Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert TradeHub's key pages from fully client-rendered to SSR-first architecture with CSS animations, per-page SEO metadata, image optimization, and lazy loading.

**Architecture:** Remove `"use client"` from page shells and presentational components, keeping it only on interactive islands (search bars, modals, dropdowns). Replace 4 motion/react animation components with pure CSS equivalents. Add `generateMetadata` exports to Server Component pages.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, CSS @keyframes

---

## File Structure

### New files
- `components/ui/hero-highlight-css.tsx` — CSS-only hero background (Server Component)
- `components/ui/text-rotate-css.tsx` — CSS-only text rotator (Server Component)
- `components/ui/stacked-cards-css.tsx` — CSS-only stacked cards (Server Component)
- `components/ui/testimonials-marquee.tsx` — CSS-only testimonial marquee (Server Component)
- `components/home/HomeSearchBar.tsx` — Client island for homepage search
- `components/home/HomeSections.tsx` — Below-the-fold lazy-loaded sections wrapper (Client Component)
- `components/listing/OfferButton.tsx` — Client island extracted from listing page
- `components/listing/PhotoGallery.tsx` — Client island for photo switching
- `components/browse/SubcategoryFilter.tsx` — Client island for browse filtering
- `hooks/useInView.ts` — IntersectionObserver hook for lazy loading
- `public/robots.txt` — Crawler directives
- `public/sitemap.xml` — Static sitemap

### Modified files
- `app/(main)/page.tsx` — Convert to Server Component shell
- `app/(main)/browse/page.tsx` — Convert to Server Component shell
- `app/(main)/listing/[id]/page.tsx` — Convert to Server Component shell
- `app/(main)/search/page.tsx` — Add metadata export, keep client content
- `app/layout.tsx` — Add metadataBase
- `app/globals.css` — Add CSS animation keyframes
- `components/listing/ListingCard.tsx` — Remove `"use client"`
- `components/category/CategoryCard.tsx` — Remove `"use client"`

### Deleted files (after replacement)
- `components/ui/hero-highlight.tsx`
- `components/ui/text-rotate.tsx`
- `components/ui/stacked-cards-interaction.tsx`
- `components/ui/testimonials-columns-1.tsx`

---

## Task 1: Add CSS Animation Keyframes to globals.css

**Files:**
- Modify: `app/globals.css:186-209` (animations section)

- [ ] **Step 1: Add all new keyframes to globals.css**

Add these keyframes after the existing `@keyframes shimmer` block at line 201:

```css
/* Hero glow pulse */
@keyframes heroGlow {
  0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.3); }
}

/* Text rotation — 5 words, 12.5s total cycle */
@keyframes rotateWord {
  0% { opacity: 0; transform: translateY(100%); }
  3% { opacity: 1; transform: translateY(0); }
  17% { opacity: 1; transform: translateY(0); }
  20% { opacity: 0; transform: translateY(-120%); }
  100% { opacity: 0; transform: translateY(-120%); }
}

/* Testimonial marquee scroll */
@keyframes marquee {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}

/* Hero fade up entrance */
@keyframes heroFadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 2: Verify CSS compiles**

Run: `cd /Users/jintanakhomwong/Documents/GitHub/tradehub-next && npx next build 2>&1 | head -20`
Expected: No CSS syntax errors

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add CSS keyframes for hero glow, text rotate, marquee, and fade-up animations"
```

---

## Task 2: Create CSS-Only Hero Highlight Component

**Files:**
- Create: `components/ui/hero-highlight-css.tsx`
- Delete: `components/ui/hero-highlight.tsx`

- [ ] **Step 1: Create the CSS-only hero highlight**

```tsx
// components/ui/hero-highlight-css.tsx
import { cn } from "@/lib/utils";

export function HeroHighlight({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center w-full overflow-hidden",
        containerClassName
      )}
      style={{ backgroundColor: "var(--dark)" }}
    >
      {/* Dot pattern background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: "radial-gradient(circle, var(--dark3) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      {/* Animated glow */}
      <div
        className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(var(--brand), 0.15) 0%, transparent 70%)",
          backgroundImage: `radial-gradient(circle, color-mix(in srgb, var(--brand) 15%, transparent) 0%, transparent 70%)`,
          animation: "heroGlow 6s ease-in-out infinite",
        }}
      />
      <div className={cn("relative z-20", className)}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Delete the old hero-highlight.tsx**

```bash
rm components/ui/hero-highlight.tsx
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/hero-highlight-css.tsx
git add -u components/ui/hero-highlight.tsx
git commit -m "feat: replace motion-based HeroHighlight with CSS-only version"
```

---

## Task 3: Create CSS-Only Text Rotate Component

**Files:**
- Create: `components/ui/text-rotate-css.tsx`
- Delete: `components/ui/text-rotate.tsx`

- [ ] **Step 1: Create the CSS text rotator**

```tsx
// components/ui/text-rotate-css.tsx
import { cn } from "@/lib/utils";

export function TextRotate({
  texts,
  className,
}: {
  texts: string[];
  className?: string;
}) {
  // Total cycle = texts.length * 2.5s
  const totalDuration = texts.length * 2.5;

  return (
    <span
      className={cn(
        "inline-flex bg-brand text-white px-3 sm:px-4 py-1 sm:py-2 rounded-xl overflow-hidden items-center justify-center min-w-[8rem] h-[2.6rem] sm:h-[3.2rem]",
        className
      )}
    >
      <span className="relative inline-block h-[2.4rem] sm:h-[3rem] overflow-hidden">
        {texts.map((text, i) => (
          <span
            key={text}
            className="block absolute w-full text-center opacity-0"
            style={{
              height: "100%",
              lineHeight: "2.4rem",
              animation: `rotateWord ${totalDuration}s ease-in-out infinite`,
              animationDelay: `${i * 2.5}s`,
            }}
          >
            {text}
          </span>
        ))}
      </span>
    </span>
  );
}
```

- [ ] **Step 2: Delete the old text-rotate.tsx**

```bash
rm components/ui/text-rotate.tsx
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/text-rotate-css.tsx
git add -u components/ui/text-rotate.tsx
git commit -m "feat: replace 240-line motion TextRotate with CSS-only version"
```

---

## Task 4: Create CSS-Only Stacked Cards Component

**Files:**
- Create: `components/ui/stacked-cards-css.tsx`
- Delete: `components/ui/stacked-cards-interaction.tsx`

- [ ] **Step 1: Create the CSS stacked cards**

```tsx
// components/ui/stacked-cards-css.tsx
import { cn } from "@/lib/utils";
import Image from "next/image";

interface CardData {
  image: string;
  title: string;
  description: string;
}

export function StackedCards({
  cards,
  spreadDistance = 45,
  rotationAngle = 6,
}: {
  cards: CardData[];
  spreadDistance?: number;
  rotationAngle?: number;
}) {
  const limitedCards = cards.slice(0, 3);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative w-[350px] h-[400px] group cursor-pointer">
        {limitedCards.map((card, index) => {
          let transform = "";
          if (index === 1) transform = `translateX(-${spreadDistance}px) rotate(-${rotationAngle}deg)`;
          if (index === 2) transform = `translateX(${spreadDistance}px) rotate(${rotationAngle}deg)`;

          return (
            <div
              key={index}
              className={cn(
                "absolute w-[350px] h-[400px] rounded-2xl overflow-hidden border bg-card border-border shadow-[0_0_10px_rgba(0,0,0,0.02)]",
                "transition-transform duration-[400ms] [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
                index === 0 ? "z-10" : "z-0"
              )}
              style={{
                transitionDelay: `${index * 100}ms`,
                ...(index !== 0 && {
                  // The CSS custom property trick: parent :hover sets the transform
                }),
              }}
            >
              <div className="relative h-72 rounded-xl shadow-lg overflow-hidden w-[calc(100%-1rem)] mx-2 mt-2">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover"
                  sizes="350px"
                />
              </div>
              <div className="px-4 p-2 flex flex-col gap-y-1">
                <h2 className="font-heading font-semibold text-sm text-foreground">{card.title}</h2>
                <p className="text-xs text-muted">{card.description}</p>
              </div>
            </div>
          );
        })}
        {/* Hover targets — invisible overlay per card position for CSS-only fan-out */}
        <style>{`
          .group:hover > div:nth-child(2) { transform: translateX(-${spreadDistance}px) rotate(-${rotationAngle}deg); }
          .group:hover > div:nth-child(3) { transform: translateX(${spreadDistance}px) rotate(${rotationAngle}deg); }
        `}</style>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Delete the old stacked-cards-interaction.tsx**

```bash
rm components/ui/stacked-cards-interaction.tsx
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/stacked-cards-css.tsx
git add -u components/ui/stacked-cards-interaction.tsx
git commit -m "feat: replace motion StackedCards with CSS-only hover fan-out"
```

---

## Task 5: Create CSS-Only Testimonials Marquee Component

**Files:**
- Create: `components/ui/testimonials-marquee.tsx`
- Delete: `components/ui/testimonials-columns-1.tsx`

- [ ] **Step 1: Create the CSS marquee testimonials**

```tsx
// components/ui/testimonials-marquee.tsx
import Image from "next/image";

export interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

export function TestimonialsColumn({
  testimonials,
  duration = 15,
  className,
}: {
  testimonials: Testimonial[];
  duration?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <div
        className="flex flex-col gap-6 pb-6"
        style={{
          animation: `marquee ${duration}s linear infinite`,
        }}
      >
        {/* Render twice for seamless loop */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex flex-col gap-6">
            {testimonials.map(({ text, image, name, role }, i) => (
              <div
                key={`${copy}-${i}`}
                className="p-8 rounded-2xl border border-border bg-card shadow-lg shadow-brand/5 max-w-xs w-full"
              >
                <div className="text-sm text-foreground leading-relaxed">{text}</div>
                <div className="flex items-center gap-2 mt-4">
                  <Image
                    width={36}
                    height={36}
                    src={image}
                    alt={name}
                    className="h-9 w-9 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div className="flex flex-col">
                    <div className="font-medium text-sm tracking-tight leading-5 text-foreground">
                      {name}
                    </div>
                    <div className="text-xs leading-5 text-subtle tracking-tight">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Delete the old testimonials component**

```bash
rm components/ui/testimonials-columns-1.tsx
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/testimonials-marquee.tsx
git add -u components/ui/testimonials-columns-1.tsx
git commit -m "feat: replace motion testimonials with CSS-only marquee"
```

---

## Task 6: Create useInView Hook

**Files:**
- Create: `hooks/useInView.ts`

- [ ] **Step 1: Create the IntersectionObserver hook**

```ts
// hooks/useInView.ts
"use client";

import { useEffect, useRef, useState } from "react";

export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px", ...options });

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isInView };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useInView.ts
git commit -m "feat: add useInView hook for lazy loading below-the-fold sections"
```

---

## Task 7: Create Client Island Components for Homepage

**Files:**
- Create: `components/home/HomeSearchBar.tsx`

- [ ] **Step 1: Create the search bar client island**

```tsx
// components/home/HomeSearchBar.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

export function HomeSearchBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useI18n();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex items-center max-w-lg mx-auto"
      style={{ animation: "heroFadeUp 0.6s ease-out 0.4s both" }}
    >
      <div className="relative w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("home.searchPlaceholder")}
          className="w-full bg-card border border-border rounded-xl pl-4 pr-12 py-3 text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand text-sm transition-all"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand text-white rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/home/HomeSearchBar.tsx
git commit -m "feat: extract HomeSearchBar as client island for SSR homepage"
```

---

## Task 8: Convert Homepage to Server Component

**Files:**
- Modify: `app/(main)/page.tsx` (full rewrite)

This is the biggest task. The homepage becomes a Server Component that imports static data directly and uses the new CSS components.

- [ ] **Step 1: Rewrite the homepage as a Server Component**

```tsx
// app/(main)/page.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/lib/data/categories";
import { LISTINGS } from "@/lib/data/listings";
import { ListingCard } from "@/components/listing/ListingCard";
import { CategoryCard } from "@/components/category/CategoryCard";
import { HeroHighlight } from "@/components/ui/hero-highlight-css";
import { TextRotate } from "@/components/ui/text-rotate-css";
import { StackedCards } from "@/components/ui/stacked-cards-css";
import { TestimonialsColumn } from "@/components/ui/testimonials-marquee";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";

const testimonials = [
  { text: "TradeHub transformed how I sell my crafts. The community is amazing and I've made connections I never expected.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face", name: "Maria Garcia", role: "Local Artist" },
  { text: "Found exactly what I needed through a barter trade. No money exchanged — just genuine community trading.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face", name: "David Kim", role: "Homeowner" },
  { text: "The blind review system gives me confidence in every trade. I know I'm dealing with trustworthy people.", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face", name: "Sarah Chen", role: "Frequent Trader" },
  { text: "As a contractor, TradeHub has been incredible for finding clients and trading services locally.", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face", name: "Marcus Johnson", role: "Contractor" },
  { text: "The trade chains feature is genius. I traded my way from a camera to a kayak in 5 steps!", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face", name: "Emma Wilson", role: "Adventure Seeker" },
  { text: "Free stuff section saved me hundreds on furniture when I moved to Prescott. Love this community.", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face", name: "Lisa Zhang", role: "New Resident" },
  { text: "I teach guitar and found students through TradeHub. The skills swap feature is perfect for educators.", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face", name: "David Rodriguez", role: "Music Teacher" },
  { text: "Customer support and dispute resolution are fair and fast. Makes trading feel safe.", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face", name: "Patricia Brown", role: "Community Volunteer" },
  { text: "Boosting my listings brought 10x more views. Premium is absolutely worth it for serious sellers.", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face", name: "James Chen", role: "Power Seller" },
];

const howItWorks = [
  { icon: "📝", title: "Create Account", description: "Sign up in seconds and set up your profile." },
  { icon: "📸", title: "Post a Listing", description: "Add photos and details about what you're offering." },
  { icon: "💬", title: "Get Offers", description: "Receive offers, negotiate, and chat with buyers." },
  { icon: "🤝", title: "Make a Deal", description: "Agree on terms and complete the trade." },
];

export default function HomePage() {
  const recentListings = LISTINGS.slice(0, 8);
  const featuredListings = LISTINGS.filter((l) => l.viewsCount > 150).slice(0, 4);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <HeroHighlight containerClassName="h-auto min-h-[32rem] sm:min-h-[36rem] py-16 sm:py-24">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 text-center">
          <div
            className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-foreground tracking-tight leading-tight mb-4"
            style={{ animation: "heroFadeUp 0.6s ease-out both" }}
          >
            <h1 className="flex flex-wrap items-center justify-center gap-x-3">
              <span>Buy, Sell, Trade,</span>
              <TextRotate texts={["Connect", "Barter", "Share", "Thrive", "Swap"]} />
            </h1>
          </div>
          <p
            className="text-muted text-base sm:text-lg max-w-xl mx-auto mb-8"
            style={{ animation: "heroFadeUp 0.6s ease-out 0.2s both" }}
          >
            Your community marketplace for buying, selling, trading, and connecting with locals.
          </p>
          <HomeSearchBar />
        </div>
      </HeroHighlight>

      {/* Featured Listings */}
      {featuredListings.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground">
              Featured Listings
            </h2>
            <Link
              href="/browse"
              className="flex items-center gap-1 text-sm text-brand hover:opacity-80 transition-opacity"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* Top Picks — Stacked Cards */}
      <section className="py-14 bg-surface2">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-3">
                Top Picks This Week
              </h2>
              <p className="text-sm text-muted max-w-md mb-6">
                Hover over the cards to discover the hottest listings in your community. From handmade crafts to local services — there&apos;s something for everyone.
              </p>
              <Link
                href="/browse"
                className="inline-flex items-center gap-1 text-sm text-brand font-medium hover:opacity-80 transition-opacity"
              >
                Browse all listings <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="h-[440px] w-[430px] shrink-0">
              <StackedCards
                cards={[
                  { image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80", title: "Handmade Ceramic Vase", description: "Beautiful blue glaze — $45" },
                  { image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80", title: "Vintage Road Bike", description: "1985 Trek — $180 negotiable" },
                  { image: "https://images.unsplash.com/photo-1510137600163-2729bc6959a4?w=600&auto=format&fit=crop&q=80", title: "Guitar Lessons", description: "All levels — $35/session" },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
        <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-6">
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Recent Listings */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground">
            Recent Listings
          </h2>
          <Link
            href="/browse"
            className="flex items-center gap-1 text-sm text-brand hover:opacity-80 transition-opacity"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-surface2 py-14">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground text-center mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-3">{step.icon}</div>
                <h3 className="font-heading font-semibold text-foreground text-sm mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-14 relative">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-10">
            <div className="border border-border py-1 px-4 rounded-lg text-xs text-muted">Testimonials</div>
            <h2 className="font-heading font-bold text-xl sm:text-2xl md:text-3xl text-foreground tracking-tight mt-4">
              What our traders say
            </h2>
            <p className="text-center mt-3 text-sm text-muted">
              Real stories from our community members.
            </p>
          </div>
          <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
            <TestimonialsColumn testimonials={testimonials.slice(0, 3)} duration={15} />
            <TestimonialsColumn testimonials={testimonials.slice(3, 6)} className="hidden md:block" duration={19} />
            <TestimonialsColumn testimonials={testimonials.slice(6, 9)} className="hidden lg:block" duration={17} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-brand to-brand2 rounded-2xl p-8 sm:p-12 text-center text-white">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-3">
              Ready to Start Trading?
            </h2>
            <p className="text-white/80 text-sm sm:text-base mb-6 max-w-md mx-auto">
              Join thousands of community members already trading on TradeHub.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/register"
                className="bg-white text-brand font-semibold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                Sign Up Free
              </Link>
              <Link
                href="/post-new"
                className="border border-white/30 text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                Post a Free Listing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
```

Note: The homepage loses i18n `t()` calls since those require the client-side `useI18n` hook. The hardcoded English strings match what the i18n keys resolved to. If i18n is needed later, it can be done via a server-side i18n approach.

- [ ] **Step 2: Verify the homepage renders**

Run: Open `http://localhost:3000` in browser
Expected: Homepage renders with CSS animations, no motion/react errors

- [ ] **Step 3: Commit**

```bash
git add app/\(main\)/page.tsx
git commit -m "feat: convert homepage to Server Component with CSS-only animations"
```

---

## Task 9: Remove "use client" from ListingCard and CategoryCard

**Files:**
- Modify: `components/listing/ListingCard.tsx:1` — remove `"use client"`
- Modify: `components/category/CategoryCard.tsx:1` — remove `"use client"`

- [ ] **Step 1: Remove "use client" from ListingCard**

Remove the first line `"use client";` from `components/listing/ListingCard.tsx`. The component only uses `Link` and `Image` — both work in Server Components.

- [ ] **Step 2: Remove "use client" from CategoryCard**

Remove the first line `"use client";` from `components/category/CategoryCard.tsx`. It only uses `Link` — works in Server Components.

- [ ] **Step 3: Verify browse page still works**

Run: Open `http://localhost:3000/browse` in browser
Expected: Categories and listings render correctly

- [ ] **Step 4: Commit**

```bash
git add components/listing/ListingCard.tsx components/category/CategoryCard.tsx
git commit -m "refactor: remove unnecessary 'use client' from ListingCard and CategoryCard"
```

---

## Task 10: Convert Browse Page to Server Component

**Files:**
- Modify: `app/(main)/browse/page.tsx` (rewrite)
- Create: `components/browse/BrowseContent.tsx` (client island for search params)

- [ ] **Step 1: Create the client island for browse filtering**

```tsx
// components/browse/BrowseContent.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/data/categories";
import { LISTINGS } from "@/lib/data/listings";
import { CategoryCard } from "@/components/category/CategoryCard";
import { ListingCard } from "@/components/listing/ListingCard";
import { EmptyState } from "@/components/common/EmptyState";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BrowseContent() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category");

  if (!categoryId) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground mb-2">
          Browse Categories
        </h1>
        <p className="text-muted text-sm mb-8">
          Explore {CATEGORIES.length} categories with {LISTINGS.length} active listings
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((category) => {
            const count = LISTINGS.filter((l) => l.categoryId === category.id).length;
            return (
              <div key={category.id} className="relative">
                <CategoryCard category={category} />
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

  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
        <EmptyState message="Category not found" icon="🔍" />
      </div>
    );
  }

  const listings = LISTINGS.filter((l) => l.categoryId === categoryId);

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
            All ({listings.length})
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <EmptyState message={`No listings in ${category.name} yet`} icon="📭" />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite browse page as Server Component shell with metadata**

```tsx
// app/(main)/browse/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseContent } from "@/components/browse/BrowseContent";

export const metadata: Metadata = {
  title: "Browse Categories | TradeHub",
  description: "Explore all categories and listings on TradeHub — your community marketplace for buying, selling, and trading.",
};

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseContent />
    </Suspense>
  );
}
```

- [ ] **Step 3: Verify browse page works**

Run: Open `http://localhost:3000/browse` and `http://localhost:3000/browse?category=electronics`
Expected: Both views render correctly

- [ ] **Step 4: Commit**

```bash
git add app/\(main\)/browse/page.tsx components/browse/BrowseContent.tsx
git commit -m "feat: convert browse page to Server Component with metadata"
```

---

## Task 11: Convert Listing Detail Page to Server Component

**Files:**
- Modify: `app/(main)/listing/[id]/page.tsx` (rewrite)
- Create: `components/listing/OfferButton.tsx` (client island)
- Create: `components/listing/PhotoGallery.tsx` (client island)

- [ ] **Step 1: Extract OfferButton as client island**

```tsx
// components/listing/OfferButton.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/lib/helpers/format";
import type { Listing } from "@/lib/types";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

export function OfferButton({ listing }: { listing: Listing }) {
  const { currentUser } = useAuthStore();
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  const isOwner = currentUser?.id === listing.userId;

  if (isOwner) {
    return (
      <Link
        href="/dashboard"
        className="w-full flex items-center justify-center gap-2 bg-surface2 text-foreground text-sm font-medium py-2.5 rounded-lg mb-3 hover:bg-surface3 transition-colors"
      >
        Edit Listing
      </Link>
    );
  }

  return (
    <Dialog>
      <DialogTrigger className="w-full bg-brand text-white text-sm font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity mb-3">
        Make an Offer
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="bg-card border-border p-6 max-w-md">
          <DialogTitle className="font-heading font-bold text-lg text-foreground mb-1">
            Make an Offer
          </DialogTitle>
          <DialogDescription className="text-xs text-muted mb-4">
            for &ldquo;{listing.title}&rdquo;
          </DialogDescription>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Offer Amount ($)</label>
              <input
                type="number"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder={`Asking: ${formatPrice(listing.price, listing.priceType)}`}
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Message (optional)</label>
              <textarea
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                rows={3}
                placeholder="Add a message to the seller..."
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <DialogClose className="flex-1 border border-border text-foreground text-sm font-medium py-2 rounded-lg hover:bg-surface2 transition-colors">
              Cancel
            </DialogClose>
            <button className="flex-1 bg-brand text-white text-sm font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity">
              Send Offer
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
```

- [ ] **Step 2: Extract PhotoGallery as client island**

```tsx
// components/listing/PhotoGallery.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { ConditionBadge } from "@/components/listing/ConditionBadge";

export function PhotoGallery({
  photos,
  title,
  condition,
}: {
  photos: string[];
  title: string;
  condition: string;
}) {
  const [activePhoto, setActivePhoto] = useState(0);
  const displayPhotos = photos.length > 0 ? photos : ["https://placehold.co/600x400/1E2330/A0A8BE?text=No+Photo"];

  return (
    <div>
      <div className="relative aspect-[4/3] bg-surface2 rounded-[var(--radius-lg)] overflow-hidden mb-3">
        <Image
          src={displayPhotos[activePhoto]}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 66vw"
          priority
        />
        <ConditionBadge condition={condition} />
        {displayPhotos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
            {activePhoto + 1} / {displayPhotos.length}
          </div>
        )}
      </div>
      {displayPhotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {displayPhotos.map((p, i) => (
            <button
              key={i}
              onClick={() => setActivePhoto(i)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                activePhoto === i
                  ? "border-brand ring-1 ring-brand/30"
                  : "border-border opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={p} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Rewrite listing detail page as Server Component**

```tsx
// app/(main)/listing/[id]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { LISTINGS } from "@/lib/data/listings";
import { USERS } from "@/lib/data/users";
import { CATEGORIES } from "@/lib/data/categories";
import { OFFERS } from "@/lib/data/offers";
import { REVIEWS } from "@/lib/data/reviews";
import { CONDITIONS } from "@/lib/data/conditions";
import { formatPrice, formatDate, timeAgo } from "@/lib/helpers/format";
import { UserAvatar } from "@/components/user/UserAvatar";
import { StarRating } from "@/components/user/StarRating";
import { TrustBadge } from "@/components/user/TrustBadge";
import { ListingCard } from "@/components/listing/ListingCard";
import { EmptyState } from "@/components/common/EmptyState";
import { PhotoGallery } from "@/components/listing/PhotoGallery";
import { OfferButton } from "@/components/listing/OfferButton";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Eye,
  Tag,
  MessageSquare,
  Shield,
  CheckCircle,
} from "lucide-react";

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const listing = LISTINGS.find((l) => l.id === params.id);
  if (!listing) return { title: "Listing Not Found | TradeHub" };
  const category = CATEGORIES.find((c) => c.id === listing.categoryId);
  return {
    title: `${listing.title} in ${listing.city} | TradeHub`,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: listing.title,
      description: listing.description.slice(0, 160),
      images: listing.photos.length > 0 ? [listing.photos[0]] : undefined,
    },
  };
}

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = LISTINGS.find((l) => l.id === params.id);
  if (!listing) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <EmptyState message="Listing not found" icon="🔍" />
      </div>
    );
  }

  const seller = USERS.find((u) => u.id === listing.userId);
  const category = CATEGORIES.find((c) => c.id === listing.categoryId);
  const condition = CONDITIONS[listing.condition];
  const offers = OFFERS.filter((o) => o.listingId === listing.id);
  const sellerReviews = seller ? REVIEWS.filter((r) => r.revieweeId === seller.id) : [];
  const similarListings = LISTINGS.filter(
    (l) => l.categoryId === listing.categoryId && l.id !== listing.id
  ).slice(0, 4);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/browse" className="hover:text-brand transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Browse
        </Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/browse?category=${category.id}`} className="hover:text-brand transition-colors">
              {category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <PhotoGallery photos={listing.photos} title={listing.title} condition={listing.condition} />

          {/* Title & Price */}
          <div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-2">
              {listing.title}
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-heading font-bold text-2xl text-brand">
                {formatPrice(listing.price, listing.priceType)}
              </span>
              {condition && (
                <span
                  className="px-2 py-0.5 rounded-md text-xs font-semibold text-white"
                  style={{ backgroundColor: condition.color }}
                >
                  {condition.emoji} {condition.label}
                </span>
              )}
              {listing.priceType === "negotiable" && (
                <span className="text-xs text-warning font-medium">Negotiable</span>
              )}
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-xs text-muted">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {listing.city}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {formatDate(listing.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {listing.viewsCount} views
            </span>
            {category && (
              <span className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> {category.name} &rsaquo; {listing.subcategory}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="font-heading font-semibold text-sm text-foreground mb-2">Description</h2>
            <p className="text-sm text-muted leading-relaxed">{listing.description}</p>
            {listing.conditionNotes && (
              <p className="text-xs text-subtle mt-2 italic">Note: {listing.conditionNotes}</p>
            )}
          </div>

          {/* Tags */}
          {listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {listing.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="px-2.5 py-1 text-[10px] rounded-full bg-surface2 text-muted border border-border hover:border-brand/30 hover:text-brand transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Offers */}
          {offers.length > 0 && (
            <div>
              <h2 className="font-heading font-semibold text-sm text-foreground mb-3">
                Offers ({offers.length})
              </h2>
              <div className="space-y-3">
                {offers.map((offer) => {
                  const buyer = USERS.find((u) => u.id === offer.buyerId);
                  return (
                    <div key={offer.id} className="bg-card border border-border rounded-[var(--radius-md)] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={buyer || null} size="sm" />
                          <div>
                            <p className="text-xs font-medium text-foreground">{buyer?.displayName || "Unknown"}</p>
                            <p className="text-[10px] text-subtle">{timeAgo(offer.createdAt)}</p>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                            offer.status === "accepted"
                              ? "bg-success/10 text-success"
                              : offer.status === "declined"
                              ? "bg-danger/10 text-danger"
                              : offer.status === "countered"
                              ? "bg-warning/10 text-warning"
                              : "bg-purple/10 text-purple"
                          }`}
                        >
                          {offer.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {offer.offerAmount > 0 ? `$${offer.offerAmount}` : offer.tradeDescription}
                      </p>
                      {offer.message && (
                        <p className="text-xs text-muted mt-1 italic">&ldquo;{offer.message}&rdquo;</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seller Reviews */}
          {sellerReviews.length > 0 && (
            <div>
              <h2 className="font-heading font-semibold text-sm text-foreground mb-3">
                Reviews for {seller?.displayName} ({sellerReviews.length})
              </h2>
              <div className="space-y-3">
                {sellerReviews.slice(0, 4).map((review) => {
                  const reviewer = USERS.find((u) => u.id === review.reviewerId);
                  return (
                    <div key={review.id} className="bg-card border border-border rounded-[var(--radius-md)] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={reviewer || null} size="sm" />
                          <div>
                            <p className="text-xs font-medium text-foreground">{reviewer?.displayName || "Unknown"}</p>
                            <p className="text-[10px] text-subtle">as {review.reviewerRole}</p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>
                      <p className="text-xs text-muted leading-relaxed">{review.comment}</p>
                      {review.quickTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {review.quickTags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-success/10 text-success">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {review.sellerReply && (
                        <div className="mt-2 pl-3 border-l-2 border-brand/30">
                          <p className="text-[10px] text-subtle">Seller reply:</p>
                          <p className="text-xs text-muted">{review.sellerReply}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-[var(--radius-md)] p-5 sticky top-20">
            <p className="font-heading font-bold text-2xl text-brand mb-4">
              {formatPrice(listing.price, listing.priceType)}
            </p>
            <OfferButton listing={listing} />
            <button className="w-full flex items-center justify-center gap-2 border border-border text-foreground text-sm font-medium py-2.5 rounded-lg hover:bg-surface2 transition-colors">
              <MessageSquare className="h-4 w-4" />
              Message Seller
            </button>
          </div>

          {seller && (
            <div className="bg-card border border-border rounded-[var(--radius-md)] p-5">
              <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Seller</h3>
              <Link href={`/profile/${seller.id}`} className="flex items-center gap-3 group">
                <UserAvatar user={seller} size="md" />
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-brand transition-colors flex items-center gap-1">
                    {seller.displayName}
                    {seller.isVerified && <CheckCircle className="h-3.5 w-3.5 text-success" />}
                  </p>
                  <p className="text-xs text-subtle">{seller.city}</p>
                </div>
              </Link>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Rating</span>
                  <span className="flex items-center gap-1">
                    <StarRating rating={seller.ratingAvg} />
                    <span className="text-subtle">({seller.reviewCount})</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Trust</span>
                  <TrustBadge score={seller.trustScore} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Response</span>
                  <span className="text-foreground font-medium">{seller.responseRate}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Member since</span>
                  <span className="text-foreground">{formatDate(seller.joinedAt)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Listings</span>
                  <span className="text-foreground">{seller.listingCount}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-1 text-xs text-muted">
                <Shield className="h-3.5 w-3.5" />
                <span>Protected by TradeHub</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Similar Listings */}
      {similarListings.length > 0 && (
        <div className="mt-12">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">Similar Listings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {similarListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify listing page works**

Run: Open `http://localhost:3000/listing/1` in browser
Expected: Listing renders with photo gallery, offer modal works

- [ ] **Step 5: Commit**

```bash
git add app/\(main\)/listing/\[id\]/page.tsx components/listing/OfferButton.tsx components/listing/PhotoGallery.tsx
git commit -m "feat: convert listing detail page to Server Component with client islands"
```

---

## Task 12: Add Metadata to Search Page

**Files:**
- Modify: `app/(main)/search/page.tsx:1-5`

- [ ] **Step 1: Add metadata export to search page**

The search page stays mostly client-side (needs search state), but add a metadata export. At the top of the file, before the default export, add:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Listings | TradeHub",
  description: "Search for items, services, and trades on TradeHub.",
};
```

Note: Since the search page uses `useSearchParams` for the query, we keep `"use client"` on the content component and wrap it in Suspense. The page file itself becomes a Server Component shell (similar to current browse pattern).

Restructure to:
```tsx
// app/(main)/search/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchContent } from "@/components/search/SearchContent";

export const metadata: Metadata = {
  title: "Search Listings | TradeHub",
  description: "Search for items, services, and trades on TradeHub.",
};

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
```

Move the existing search page content into `components/search/SearchContent.tsx` with `"use client"`.

- [ ] **Step 2: Create SearchContent client component**

Copy the entire existing content of `app/(main)/search/page.tsx` (the inner component that uses hooks) into `components/search/SearchContent.tsx`, keeping `"use client"` and renaming the export to `SearchContent`.

- [ ] **Step 3: Verify search works**

Run: Open `http://localhost:3000/search?q=bike` in browser
Expected: Search results render correctly

- [ ] **Step 4: Commit**

```bash
git add app/\(main\)/search/page.tsx components/search/SearchContent.tsx
git commit -m "feat: add metadata to search page with Server Component shell"
```

---

## Task 13: Add Root Metadata and SEO Files

**Files:**
- Modify: `app/layout.tsx:19-22`
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`

- [ ] **Step 1: Add metadataBase to root layout**

In `app/layout.tsx`, update the metadata export:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://tradehub.com"),
  title: {
    default: "TradeHub - Buy, Sell, Trade, Connect",
    template: "%s | TradeHub",
  },
  description: "Community-driven marketplace for trading, bartering, and sharing.",
  openGraph: {
    siteName: "TradeHub",
    type: "website",
  },
};
```

- [ ] **Step 2: Create robots.txt**

```
# public/robots.txt
User-agent: *
Allow: /
Sitemap: https://tradehub.com/sitemap.xml
```

- [ ] **Step 3: Create sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://tradehub.com/</loc><priority>1.0</priority></url>
  <url><loc>https://tradehub.com/browse</loc><priority>0.9</priority></url>
  <url><loc>https://tradehub.com/search</loc><priority>0.7</priority></url>
  <url><loc>https://tradehub.com/community</loc><priority>0.6</priority></url>
  <url><loc>https://tradehub.com/register</loc><priority>0.5</priority></url>
  <url><loc>https://tradehub.com/login</loc><priority>0.3</priority></url>
</urlset>
```

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx public/robots.txt public/sitemap.xml
git commit -m "feat: add root metadata, robots.txt, and sitemap.xml for SEO"
```

---

## Task 14: Final Verification and Cleanup

**Files:**
- Verify all pages render
- Check for unused imports

- [ ] **Step 1: Run the build to check for errors**

Run: `cd /Users/jintanakhomwong/Documents/GitHub/tradehub-next && npx next build 2>&1`
Expected: Build succeeds with no errors

- [ ] **Step 2: Manually verify all key pages**

Open each in browser and verify rendering:
- `http://localhost:3000` — Homepage with CSS animations
- `http://localhost:3000/browse` — Categories grid
- `http://localhost:3000/browse?category=electronics` — Category detail
- `http://localhost:3000/listing/1` — Listing with photo gallery and offer modal
- `http://localhost:3000/search?q=bike` — Search results

- [ ] **Step 3: Check that old animation component files are deleted**

```bash
ls components/ui/hero-highlight.tsx components/ui/text-rotate.tsx components/ui/stacked-cards-interaction.tsx components/ui/testimonials-columns-1.tsx 2>&1
```

Expected: "No such file or directory" for all 4

- [ ] **Step 4: Final commit if any cleanup was needed**

```bash
git add -A
git commit -m "chore: final cleanup after SSR optimization"
```
