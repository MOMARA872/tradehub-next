"use client";

import { useAuth } from "@/hooks/useAuth";
import { TRADE_CHAINS } from "@/lib/data/trade-chains";
import type { User } from "@/lib/types";
import { UserAvatar } from "@/components/user/UserAvatar";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/helpers/format";
import { Link2, Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function TradeChainPage() {
  const { currentUser, isLoggedIn } = useAuth();

  if (!isLoggedIn || !currentUser) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in">
        <div className="text-5xl mb-4">&#x1f512;</div>
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
          Sign in to view trade chains
        </h1>
        <p className="text-muted text-sm mb-6">
          You need to be logged in to access your trade chains.
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

  const myChains = TRADE_CHAINS.filter(
    (chain) => chain.userId === currentUser.id
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Link2 className="h-6 w-6 text-brand" />
        <h1 className="font-heading font-bold text-2xl text-foreground">
          Trade Chains
        </h1>
      </div>

      {myChains.length === 0 ? (
        <EmptyState
          message="You haven't started any trade chains yet. Begin your first quest!"
          icon="&#x1f517;"
        />
      ) : (
        <div className="space-y-8">
          {myChains.map((chain) => {
            const lastStep = chain.steps[chain.steps.length - 1];
            const isComplete = lastStep?.item === chain.goalItem;

            return (
              <div
                key={chain.id}
                className="bg-card border border-border rounded-[var(--radius-md)] overflow-hidden"
              >
                {/* Chain Header */}
                <div className="p-5 border-b border-border">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="font-heading font-semibold text-foreground text-lg mb-2">
                        {chain.name}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <span>
                          {chain.startEmoji} {chain.startItem}
                        </span>
                        <ArrowRight className="h-4 w-4 text-subtle" />
                        <span>
                          {chain.goalEmoji} {chain.goalItem}
                        </span>
                      </div>
                    </div>
                    {isComplete && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
                        <Trophy className="h-3.5 w-3.5" />
                        QUEST COMPLETE
                      </span>
                    )}
                  </div>
                </div>

                {/* Steps Timeline */}
                <div className="p-5">
                  <div className="relative pl-6">
                    {/* Vertical line */}
                    <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />

                    <div className="space-y-6">
                      {chain.steps.map((step, i) => {
                        const tradedUser = null as (User | null);

                        return (
                          <div key={i} className="relative flex gap-4 items-start">
                            {/* Dot */}
                            <div className="absolute left-[-18px] top-1.5 h-3 w-3 rounded-full bg-brand border-2 border-card z-10" />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-lg">{step.emoji}</span>
                                <span className="font-semibold text-foreground text-sm">
                                  {step.item}
                                </span>
                                <span className="text-xs text-subtle">
                                  ${step.value}
                                </span>
                              </div>
                              <p className="text-sm text-muted mb-1">
                                {step.description}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-subtle">
                                <span>Traded with: {step.tradedWith}</span>
                                {tradedUser && (
                                  <UserAvatar user={tradedUser} size="sm" />
                                )}
                                <span>{formatDate(step.date)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
