"use client";

import Link from "next/link";
import { useRegionStore } from "@/store/regionStore";
import { useI18n } from "@/hooks/useI18n";

const footerSections = [
  {
    title: "Quick Links",
    links: [
      { label: "Home", href: "/" },
      { label: "Browse", href: "/browse" },
      { label: "Search", href: "/search" },
      { label: "Post Listing", href: "/post-new" },
    ],
  },
  {
    title: "Trust & Safety",
    links: [
      { label: "Blind Reviews", href: "/reviews" },
      { label: "Disputes", href: "/disputes" },
      { label: "Saved Searches", href: "/saved-searches" },
    ],
  },
  {
    title: "Growth & Tools",
    links: [
      { label: "Map View", href: "/map-view" },
      { label: "Trade Chains", href: "/discover-chains" },
      { label: "Boost Listing", href: "/boost" },
      { label: "Community", href: "/community" },
    ],
  },
  {
    title: "More",
    links: [
      { label: "Analytics", href: "/analytics" },
      { label: "Admin", href: "/admin" },
      { label: "Settings", href: "/settings" },
    ],
  },
];

export function Footer() {
  const { selectedRegion } = useRegionStore();
  const { t } = useI18n();

  return (
    <footer className="bg-surface2 border-t" style={{ borderColor: "var(--border-color)" }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <h4 className="font-heading font-bold text-foreground text-base mb-2">TradeHub</h4>
            <p className="text-xs text-muted leading-relaxed">
              Community-driven marketplace for trading, bartering, and sharing.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-heading font-semibold text-foreground text-sm mb-3">
                {section.title}
              </h4>
              <ul className="space-y-1.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs text-muted hover:text-brand transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-foreground text-sm mb-3">Contact</h4>
            <p className="text-xs text-muted mb-1">Email: hello@tradehub.local</p>
            <p className="text-xs text-muted">📍 {selectedRegion.name}</p>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center" style={{ borderColor: "var(--border-color)" }}>
          <p className="text-xs text-subtle">&copy; 2024 TradeHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
