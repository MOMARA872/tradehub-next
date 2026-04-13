"use client";

import { useAuth } from "@/hooks/useAuth";
import { PREMIUM_PLANS, USER_SUBSCRIPTIONS } from "@/lib/data/premium";
import { Check, Crown, Star, CircleDot, Gem, type LucideIcon } from "lucide-react";

const PLAN_ICONS: Record<string, LucideIcon> = { CircleDot, Star, Gem };
import Link from "next/link";

export default function PremiumPage() {
  const { currentUser, isLoggedIn } = useAuth();

  const userSub = isLoggedIn && currentUser
    ? USER_SUBSCRIPTIONS.find(
        (s) => s.userId === currentUser.id && s.status === "active"
      )
    : null;
  const currentPlanId = userSub?.planId ?? "free";

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Crown className="h-7 w-7 text-brand" />
          <h1 className="font-heading font-bold text-2xl text-foreground">
            Premium Plans
          </h1>
        </div>
        <p className="text-muted text-sm max-w-lg mx-auto">
          Unlock more listings, analytics, and priority features to grow your
          trading presence on TradeHub.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PREMIUM_PLANS.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId;
          const isPopular = plan.popular === true;

          return (
            <div
              key={plan.id}
              className={`relative bg-card border rounded-[var(--radius-md)] p-6 flex flex-col ${
                isPopular
                  ? "ring-2 ring-brand border-brand/40"
                  : "border-border"
              }`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-brand text-white text-xs font-semibold px-3 py-1 rounded-full">
                    <Star className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Current Plan
                  </span>
                </div>
              )}

              {/* Icon & Name */}
              <div className="text-center mb-4 mt-2">
                <div className="flex justify-center mb-2">{(() => { const Icon = PLAN_ICONS[plan.icon]; return Icon ? <Icon className="h-9 w-9" /> : null; })()}</div>
                <h2 className="font-heading font-bold text-lg text-foreground">
                  {plan.name}
                </h2>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                {plan.price === 0 ? (
                  <div className="font-heading font-bold text-3xl text-foreground">
                    Free
                  </div>
                ) : (
                  <div>
                    <span className="font-heading font-bold text-3xl text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-muted text-sm">/{plan.period}</span>
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Limits Info */}
              <div className="bg-surface2 rounded-[var(--radius-md)] p-3 mb-5 text-xs text-muted space-y-1">
                <p>
                  Listings:{" "}
                  <span className="text-foreground font-medium">
                    {plan.limits.maxListings === -1
                      ? "Unlimited"
                      : plan.limits.maxListings}
                  </span>
                </p>
                <p>
                  Boost credits:{" "}
                  <span className="text-foreground font-medium">
                    {plan.limits.boostCredits}/mo
                  </span>
                </p>
                <p>
                  Analytics:{" "}
                  <span className="text-foreground font-medium">
                    {plan.limits.analyticsAccess ? "Yes" : "No"}
                  </span>
                </p>
                <p>
                  Priority support:{" "}
                  <span className="text-foreground font-medium">
                    {plan.limits.prioritySupport ? "Yes" : "No"}
                  </span>
                </p>
              </div>

              {/* CTA Button */}
              {isCurrentPlan ? (
                <button
                  disabled
                  className="w-full bg-surface2 text-muted font-semibold text-sm px-5 py-2.5 rounded-lg border border-border cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : plan.id === "free" ? (
                <Link
                  href="/login"
                  className="block text-center bg-surface2 text-foreground font-semibold text-sm px-5 py-2.5 rounded-lg border border-border hover:border-brand/30 transition-colors"
                >
                  Get Started
                </Link>
              ) : (
                <button className="w-full bg-brand text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
                  Upgrade
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
