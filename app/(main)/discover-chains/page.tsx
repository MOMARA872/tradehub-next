"use client";

import { TRADE_CHAINS } from "@/lib/data/trade-chains";
import type { User } from "@/lib/types";
import { UserAvatar } from "@/components/user/UserAvatar";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/helpers/format";
import { Compass, ArrowRight, TrendingDown, TrendingUp, Footprints } from "lucide-react";

export default function DiscoverChainsPage() {
  const publicChains = TRADE_CHAINS.filter((chain) => chain.isPublic);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Compass className="h-6 w-6 text-brand" />
          <h1 className="font-heading font-bold text-2xl text-foreground">
            Discover Trade Chains
          </h1>
        </div>
        <p className="text-muted text-sm">
          Explore public trade chains from the community and get inspired for
          your next quest.
        </p>
      </div>

      {publicChains.length === 0 ? (
        <EmptyState
          message="No public trade chains to explore yet."
          icon="&#x1f30d;"
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {publicChains.map((chain) => {
            const owner = null as (User | null);
            const firstValue = chain.steps[0]?.value ?? 0;
            const lastValue =
              chain.steps[chain.steps.length - 1]?.value ?? 0;
            const valueChange = lastValue - firstValue;
            const isPositive = valueChange >= 0;

            return (
              <div
                key={chain.id}
                className="relative bg-card border border-border rounded-[var(--radius-md)] overflow-hidden group"
                style={{
                  borderImage: `linear-gradient(135deg, var(--color-brand), ${chain.steps.length >= 4 ? '#a855f7' : '#3b82f6'}) 1`,
                }}
              >
                {/* Gradient top accent */}
                <div
                  className="h-1 w-full"
                  style={{
                    background: `linear-gradient(90deg, var(--color-brand), ${chain.steps.length >= 4 ? '#a855f7' : '#3b82f6'})`,
                  }}
                />

                <div className="p-5">
                  {/* User row */}
                  <div className="flex items-center gap-3 mb-4">
                    <UserAvatar user={owner} size="sm" />
                    <div>
                      <span className="text-sm font-semibold text-foreground">
                        {owner?.displayName ?? "Unknown"}
                      </span>
                      <p className="text-xs text-subtle">
                        {owner?.city ?? ""}
                      </p>
                    </div>
                  </div>

                  {/* Chain name */}
                  <h3 className="font-heading font-semibold text-foreground text-base mb-3">
                    {chain.name}
                  </h3>

                  {/* Start to Goal */}
                  <div className="flex items-center gap-2 mb-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 bg-surface2 px-2.5 py-1 rounded-full">
                      <span className="text-base">{chain.startEmoji}</span>
                      <span className="text-foreground font-medium">
                        {chain.startItem}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-subtle shrink-0" />
                    <span className="inline-flex items-center gap-1.5 bg-surface2 px-2.5 py-1 rounded-full">
                      <span className="text-base">{chain.goalEmoji}</span>
                      <span className="text-foreground font-medium">
                        {chain.goalItem}
                      </span>
                    </span>
                  </div>

                  {/* Step preview */}
                  <div className="flex items-center gap-1 mb-4">
                    {chain.steps.map((step, i) => (
                      <span
                        key={i}
                        className="text-lg"
                        title={step.item}
                      >
                        {step.emoji}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <Footprints className="h-3.5 w-3.5" />
                      <span>
                        {chain.steps.length} step
                        {chain.steps.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-1 font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {isPositive ? "+" : ""}${valueChange}
                      </span>
                    </div>
                    <span className="text-subtle">
                      Started {formatDate(chain.steps[0]?.date ?? "")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
