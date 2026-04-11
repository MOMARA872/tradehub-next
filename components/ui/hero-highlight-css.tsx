// components/ui/hero-highlight-css.tsx
import { cn } from "@/lib/utils";

export function HeroHighlight({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center w-full overflow-hidden",
        containerClassName
      )}
      style={{ backgroundColor: "var(--dark)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: "radial-gradient(circle, var(--dark3) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, color-mix(in srgb, var(--brand) 15%, transparent) 0%, transparent 70%)`,
          animation: "heroGlow 6s ease-in-out infinite",
        }}
      />
      <div className={cn("relative z-20", className)}>{children}</div>
    </div>
  );
}
