"use client";

import { useState } from "react";
import { Crown, ExternalLink, Loader2 } from "lucide-react";
import type { User } from "@/lib/types";

export function SubscriptionSection({ user }: { user: User }) {
  const [loading, setLoading] = useState(false);

  const isPro =
    user.tier === "pro" &&
    (user.subscriptionStatus === "active" ||
      user.subscriptionStatus === "trialing");

  const isTrialing = user.subscriptionStatus === "trialing";
  const isCanceled = user.subscriptionStatus === "canceled";

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  async function handleManageBilling() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2 className="font-heading font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
        <Crown className="h-4 w-4" />
        Subscription
      </h2>

      <div className="bg-card border border-border rounded-[var(--radius-md)] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {isPro ? "TradeHub Pro" : "Free Plan"}
            </p>
            {isTrialing && user.trialEndsAt && (
              <p className="text-xs text-muted mt-0.5">
                Trial ends{" "}
                {new Date(user.trialEndsAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
            {isPro && !isTrialing && (
              <p className="text-xs text-muted mt-0.5">$6.99/month</p>
            )}
            {isCanceled && (
              <p className="text-xs text-danger mt-0.5">
                Subscription canceled
              </p>
            )}
          </div>

          {isPro && (
            <span className="text-[10px] font-semibold bg-brand/10 text-brand px-2 py-0.5 rounded-full">
              PRO
            </span>
          )}
        </div>

        {!isPro && (
          <div className="mb-4 space-y-1.5">
            <p className="text-xs text-muted">Upgrade to unlock:</p>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-brand">&#10003;</span> Sell at fixed prices
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-brand">&#10003;</span> Trust verification badge
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-brand">&#10003;</span> 30-day free trial
            </div>
          </div>
        )}

        {!isPro && (
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-brand text-white text-sm font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
            {isCanceled ? "Resubscribe to Pro" : "Start Free Trial"}
          </button>
        )}

        {isPro && (
          <button
            onClick={handleManageBilling}
            disabled={loading}
            className="w-full border border-border text-foreground text-sm font-medium py-2.5 rounded-lg hover:bg-surface2 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Manage Billing
          </button>
        )}
      </div>
    </section>
  );
}
