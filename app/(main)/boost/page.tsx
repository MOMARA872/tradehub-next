"use client";

import { useAuth } from "@/hooks/useAuth";
import { BOOST_PLANS, BOOSTED_LISTINGS } from "@/lib/data/boost";
import { Zap, TrendingUp, Check } from "lucide-react";
import Link from "next/link";

export default function BoostPage() {
  const { currentUser, isLoggedIn } = useAuth();

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in">
        <div className="text-5xl mb-4">&#x1f512;</div>
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
          Sign in to boost listings
        </h1>
        <p className="text-muted text-sm mb-6">
          You need to be logged in to boost your listings.
        </p>
        <Link
          href="/login"
          className="inline-block bg-brand text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const myBoosted = BOOSTED_LISTINGS.filter(
    () => false // TODO: Replace with Supabase query filtered by currentUser.id
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-2">
        <Zap className="h-6 w-6 text-brand" />
        <h1 className="font-heading font-bold text-2xl text-foreground">
          Boost Your Listing
        </h1>
      </div>
      <p className="text-muted text-sm mb-8">
        Get more eyes on your listings with a visibility boost.
      </p>

      {/* Plan Cards */}
      <div className="grid gap-6 sm:grid-cols-3 mb-12">
        {BOOST_PLANS.map((plan) => (
          <div
            key={plan.id}
            className="relative bg-card rounded-[var(--radius-md)] overflow-hidden flex flex-col"
            style={{
              border: `2px solid ${plan.color}40`,
            }}
          >
            {/* Popular badge */}
            {plan.popular && (
              <div
                className="text-center text-[11px] font-bold text-white py-1"
                style={{ backgroundColor: plan.color }}
              >
                MOST POPULAR
              </div>
            )}

            <div className="p-5 flex flex-col flex-1">
              {/* Icon + Name */}
              <div className="text-center mb-4">
                <span className="text-3xl">{plan.icon}</span>
                <h3 className="font-heading font-bold text-foreground text-lg mt-2">
                  {plan.name}
                </h3>
                <p className="text-xs text-muted mt-1">{plan.duration}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-4">
                <span className="font-heading font-bold text-3xl text-foreground">
                  ${plan.price}
                </span>
              </div>

              {/* Multiplier */}
              <div
                className="text-center mb-5 inline-flex items-center gap-1.5 mx-auto text-sm font-semibold px-3 py-1 rounded-full"
                style={{
                  backgroundColor: `${plan.color}20`,
                  color: plan.color,
                }}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                {plan.multiplier} visibility
              </div>

              {/* Features -- only for plans that have them via type narrowing */}
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  `${plan.multiplier} visibility in search results`,
                  plan.popular
                    ? "Featured badge on listing"
                    : "Highlighted border on listing",
                  "Analytics dashboard",
                ].map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted"
                  >
                    <Check
                      className="h-4 w-4 shrink-0 mt-0.5"
                      style={{ color: plan.color }}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className="w-full font-semibold text-sm py-2.5 rounded-lg transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: plan.popular ? plan.color : "transparent",
                  color: plan.popular ? "#fff" : plan.color,
                  border: plan.popular ? "none" : `1.5px solid ${plan.color}`,
                }}
              >
                Select Plan
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Currently Boosted Section */}
      <div>
        <h2 className="font-heading font-bold text-lg text-foreground mb-4">
          Currently Boosted
        </h2>

        {myBoosted.length === 0 ? (
          <div className="bg-card border border-border rounded-[var(--radius-md)] p-8 text-center">
            <p className="text-muted text-sm">
              You don&apos;t have any boosted listings yet. Select a plan above
              to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {myBoosted.map((boost) => {
              const listing = null;
              const plan = BOOST_PLANS.find((p) => p.id === boost.boostPlan);
              const ctr =
                boost.impressions > 0
                  ? ((boost.clicks / boost.impressions) * 100).toFixed(1)
                  : "0.0";

              return (
                <div
                  key={boost.listingId}
                  className="bg-card border border-border rounded-[var(--radius-md)] p-5"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                        <h3 className="font-heading font-semibold text-foreground text-base">
                          {"Unknown Listing"}
                        </h3>
                        {plan && (
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${plan.color}20`,
                              color: plan.color,
                            }}
                          >
                            {plan.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-subtle">
                        {boost.startedAt} &mdash; {boost.expiresAt}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-center">
                        <p className="font-heading font-bold text-lg text-foreground">
                          {boost.impressions.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-muted">Impressions</p>
                      </div>
                      <div className="text-center">
                        <p className="font-heading font-bold text-lg text-foreground">
                          {boost.clicks}
                        </p>
                        <p className="text-[11px] text-muted">Clicks</p>
                      </div>
                      <div className="text-center">
                        <p className="font-heading font-bold text-lg text-brand">
                          {ctr}%
                        </p>
                        <p className="text-[11px] text-muted">CTR</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
