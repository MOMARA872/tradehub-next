"use client";

import { useState, useEffect } from "react";
import { Crown, X } from "lucide-react";

const DISMISS_KEY = "tradehub_dismiss_upgrade_banner";

export function UpgradeBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "true");
  }

  if (dismissed) return null;

  return (
    <div className="bg-brand/10 border border-brand/20 rounded-[var(--radius-md)] p-4 mb-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Crown className="h-5 w-5 text-brand shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Upgrade to Pro for $6.99/mo
          </p>
          <p className="text-xs text-muted mt-0.5">
            Sell at fixed prices and get verified. Start your 30-day free trial.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href="/settings"
          className="bg-brand text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Upgrade
        </a>
        <button
          onClick={handleDismiss}
          className="text-muted hover:text-foreground transition-colors p-1"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
