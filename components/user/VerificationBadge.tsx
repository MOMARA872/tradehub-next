import { VERIFICATION_REQUESTS, VERIFICATION_LEVELS } from "@/lib/data/verification";
import { Shield, Check, Square, Phone, Mail, IdCard, MapPin, Link, type LucideIcon } from "lucide-react";

const VERIFICATION_ICONS: Record<string, LucideIcon> = {
  Phone, Mail, IdCard, MapPin, Link,
};

const BADGE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  platinum: { bg: "bg-gradient-to-r from-purple-500 to-purple-700", text: "text-white", label: "Platinum" },
  gold: { bg: "bg-gradient-to-r from-yellow-500 to-amber-600", text: "text-white", label: "Gold" },
  silver: { bg: "bg-gradient-to-r from-gray-300 to-gray-500", text: "text-white", label: "Silver" },
  bronze: { bg: "bg-gradient-to-r from-orange-400 to-orange-600", text: "text-white", label: "Bronze" },
};

export function VerificationBadge({ userId }: { userId: string }) {
  const request = VERIFICATION_REQUESTS.find((v) => v.userId === userId);
  if (!request) return null;

  const badge = BADGE_COLORS[request.badgeLevel];
  if (!badge) return null;

  const totalWeight = Object.values(VERIFICATION_LEVELS).reduce((sum, v) => sum + v.weight, 0);
  const completedWeight = request.verifications.reduce((sum, key) => {
    const level = VERIFICATION_LEVELS[key];
    return sum + (level?.weight || 0);
  }, 0);
  const percentage = Math.round((completedWeight / totalWeight) * 100);

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.bg} ${badge.text}`}
      title={`${badge.label} Verified (${percentage}%)`}
    >
      <Shield className="h-3 w-3" />
      {badge.label}
    </div>
  );
}

export function VerificationProgress({ userId }: { userId: string }) {
  const request = VERIFICATION_REQUESTS.find((v) => v.userId === userId);
  if (!request) return null;

  const levels = Object.entries(VERIFICATION_LEVELS);
  const completedCount = request.verifications.length;
  const totalCount = levels.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted">Verification</span>
        <span className="text-foreground font-medium">{percentage}%</span>
      </div>
      <div className="h-1.5 bg-surface3 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-1 mt-2">
        {levels.map(([key, level]) => {
          const completed = request.verifications.includes(key);
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              {completed ? (
                <Check className="h-3 w-3 text-emerald-500 shrink-0" />
              ) : (
                <Square className="h-3 w-3 text-subtle shrink-0" />
              )}
              <span className={`flex items-center gap-1 ${completed ? "text-foreground" : "text-subtle"}`}>
                {(() => { const Icon = VERIFICATION_ICONS[level.icon]; return Icon ? <Icon className="h-3 w-3" /> : null; })()}
                {level.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
