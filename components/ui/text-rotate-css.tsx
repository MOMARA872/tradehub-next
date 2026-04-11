// components/ui/text-rotate-css.tsx
import { cn } from "@/lib/utils";

export function TextRotate({
  texts,
  className,
}: {
  texts: string[];
  className?: string;
}) {
  const totalDuration = texts.length * 2.5;

  return (
    <span
      className={cn(
        "inline-flex bg-brand text-white px-3 sm:px-4 py-1 sm:py-2 rounded-xl overflow-hidden items-center justify-center min-w-[8rem] h-[2.6rem] sm:h-[3.2rem]",
        className
      )}
    >
      <span className="relative inline-block h-[2.4rem] sm:h-[3rem] overflow-hidden">
        {texts.map((text, i) => (
          <span
            key={text}
            className="block absolute w-full text-center opacity-0"
            style={{
              height: "100%",
              lineHeight: "2.4rem",
              animation: `rotateWord ${totalDuration}s ease-in-out infinite`,
              animationDelay: `${i * 2.5}s`,
            }}
          >
            {text}
          </span>
        ))}
      </span>
    </span>
  );
}
