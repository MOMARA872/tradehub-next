import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const revalidate = 3600; // ISR: revalidate homepage every hour
import { createClient } from "@/lib/supabase/server";
import { dbListingToListing } from "@/lib/types";
import { ListingCard } from "@/components/listing/ListingCard";
import { CategoryCard } from "@/components/category/CategoryCard";
import { HeroHighlight } from "@/components/ui/hero-highlight-css";
import { HeroTextRotate } from "@/components/home/HeroTextRotate";
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

export default async function HomePage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  const { data: recentRows } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: featuredRows } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(4);

  const recentListings = (recentRows ?? []).map(dbListingToListing);
  const featuredListings = (featuredRows ?? []).map(dbListingToListing);

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
              <HeroTextRotate />
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
          {(categories ?? []).map((category) => (
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
          <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand2 to-brand opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.1),transparent_50%)]" />
            <div className="relative z-10">
              <h2 className="font-heading font-bold text-2xl sm:text-3xl mb-3 text-white drop-shadow-sm">
                Ready to Start Trading?
              </h2>
              <p className="text-white/85 text-sm sm:text-base mb-8 max-w-md mx-auto">
                Join thousands of community members already trading on TradeHub.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="bg-white text-brand font-semibold text-sm px-6 py-3 rounded-lg shadow-lg shadow-black/10 hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  Sign Up Free
                </Link>
                <Link
                  href="/post-new"
                  className="border border-white/40 text-white font-semibold text-sm px-6 py-3 rounded-lg backdrop-blur-sm hover:bg-white/15 hover:border-white/60 transition-all"
                >
                  Post a Free Listing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
