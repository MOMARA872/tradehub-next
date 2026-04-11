// components/ui/stacked-cards-css.tsx
import { cn } from "@/lib/utils";
import Image from "next/image";

interface CardData {
  image: string;
  title: string;
  description: string;
}

export function StackedCards({
  cards,
  spreadDistance = 45,
  rotationAngle = 6,
}: {
  cards: CardData[];
  spreadDistance?: number;
  rotationAngle?: number;
}) {
  const limitedCards = cards.slice(0, 3);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative w-[350px] h-[400px] group cursor-pointer">
        {limitedCards.map((card, index) => (
          <div
            key={index}
            className={cn(
              "absolute w-[350px] h-[400px] rounded-2xl overflow-hidden border bg-card border-border shadow-[0_0_10px_rgba(0,0,0,0.02)]",
              "transition-transform duration-[400ms] [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
              index === 0 ? "z-10" : "z-0",
              index === 1 && "group-hover:[-translate-x-[45px]] group-hover:[-rotate-6]",
              index === 2 && "group-hover:[translate-x-[45px]] group-hover:[rotate-6]"
            )}
            style={{
              transitionDelay: `${index * 100}ms`,
            }}
          >
            <div className="relative h-72 rounded-xl shadow-lg overflow-hidden w-[calc(100%-1rem)] mx-2 mt-2">
              <Image
                src={card.image}
                alt={card.title}
                fill
                className="object-cover"
                sizes="350px"
              />
            </div>
            <div className="px-4 p-2 flex flex-col gap-y-1">
              <h2 className="font-heading font-semibold text-sm text-foreground">{card.title}</h2>
              <p className="text-xs text-muted">{card.description}</p>
            </div>
          </div>
        ))}
        <style>{`
          .group:hover > div:nth-child(2) { transform: translateX(-${spreadDistance}px) rotate(-${rotationAngle}deg); }
          .group:hover > div:nth-child(3) { transform: translateX(${spreadDistance}px) rotate(${rotationAngle}deg); }
        `}</style>
      </div>
    </div>
  );
}
