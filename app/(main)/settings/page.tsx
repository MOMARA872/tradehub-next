"use client";

import { useTheme } from "next-themes";
import { useI18n } from "@/hooks/useI18n";
import { useRegionStore } from "@/store/regionStore";
import { useAuth } from "@/hooks/useAuth";
import { REGIONS } from "@/lib/data/regions";
import { SUPPORTED_LANGUAGES, type LangCode } from "@/i18n";
import { Sun, Moon, Palette, Globe, MapPin, Check } from "lucide-react";
import Link from "next/link";
import { SubscriptionSection } from "@/components/settings/SubscriptionSection";

const THEMES = [
  { id: "warm", label: "Warm", icon: Palette, colors: ["#D4603A", "#FBF7F4", "#F3EDE8"] },
  { id: "dark", label: "Dark", icon: Moon, colors: ["#FF5722", "#0D0F11", "#151820"] },
  { id: "light", label: "Light", icon: Sun, colors: ["#1976D2", "#FFFFFF", "#F5F5F5"] },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const { selectedRegion, setRegion } = useRegionStore();
  const { currentUser, isLoggedIn } = useAuth();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <h1 className="font-heading font-bold text-2xl text-foreground mb-8">
        {t("settings.title")}
      </h1>

      {/* Theme */}
      <section className="mb-8">
        <h2 className="font-heading font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4" /> {t("settings.theme")}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((th) => {
            const active = theme === th.id;
            return (
              <button
                key={th.id}
                onClick={() => setTheme(th.id)}
                className={`relative bg-card border rounded-[var(--radius-md)] p-4 text-center transition-all hover:-translate-y-0.5 ${
                  active ? "border-brand shadow-md ring-1 ring-brand" : "border-border hover:border-brand/30"
                }`}
              >
                {active && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-brand" />
                  </div>
                )}
                <div className="flex justify-center gap-1 mb-2">
                  {th.colors.map((c, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border border-white/20"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-foreground">{th.label}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Language */}
      <section className="mb-8">
        <h2 className="font-heading font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4" /> {t("settings.language")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const active = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code as LangCode)}
                className={`relative bg-card border rounded-[var(--radius-md)] p-3 text-center transition-all hover:-translate-y-0.5 ${
                  active ? "border-brand shadow-md ring-1 ring-brand" : "border-border hover:border-brand/30"
                }`}
              >
                {active && (
                  <div className="absolute top-1.5 right-1.5">
                    <Check className="h-3.5 w-3.5 text-brand" />
                  </div>
                )}
                <span className="text-2xl block mb-1">{lang.flag}</span>
                <p className="text-xs font-medium text-foreground">{lang.label}</p>
                {lang.dir === "rtl" && (
                  <span className="text-[9px] text-subtle">RTL</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Region */}
      <section className="mb-8">
        <h2 className="font-heading font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4" /> {t("settings.region")}
        </h2>
        <div className="bg-card border border-border rounded-[var(--radius-md)] divide-y divide-border">
          {REGIONS.map((region) => {
            const active = selectedRegion.id === region.id;
            return (
              <button
                key={region.id}
                onClick={() => setRegion(region.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface2 transition-colors text-left"
              >
                <span className={`text-sm ${active ? "text-brand font-medium" : "text-foreground"}`}>
                  {region.name}
                </span>
                {active && <Check className="h-4 w-4 text-brand" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Subscription */}
      {currentUser && <SubscriptionSection user={currentUser} />}

      {/* Account Info */}
      {isLoggedIn && currentUser && (
        <section className="mb-8">
          <h2 className="font-heading font-semibold text-sm text-foreground mb-3">
            {t("settings.account")}
          </h2>
          <div className="bg-card border border-border rounded-[var(--radius-md)] p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Name</span>
              <span className="text-foreground font-medium">{currentUser.displayName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Location</span>
              <span className="text-foreground">{currentUser.city}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Member since</span>
              <span className="text-foreground">{currentUser.joinedAt}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Verified</span>
              <span className="inline-flex items-center gap-1 text-foreground">{currentUser.isVerified ? (<><Check className="h-3 w-3 text-emerald-500" />Yes</>) : "No"}</span>
            </div>
          </div>
        </section>
      )}

      {!isLoggedIn && (
        <div className="bg-card border border-border rounded-[var(--radius-md)] p-6 text-center">
          <p className="text-sm text-muted mb-3">Sign in to access account settings</p>
          <Link
            href="/login"
            className="inline-flex bg-brand text-white text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Login
          </Link>
        </div>
      )}
    </div>
  );
}
