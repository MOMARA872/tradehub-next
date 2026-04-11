"use client";

import { useState } from "react";
import Image from "next/image";
import { ConditionBadge } from "@/components/listing/ConditionBadge";
import type { ConditionKey } from '@/lib/types';

export function PhotoGallery({
  photos,
  title,
  condition,
}: {
  photos: string[];
  title: string;
  condition: ConditionKey;
}) {
  const [activePhoto, setActivePhoto] = useState(0);
  const displayPhotos = photos.length > 0 ? photos : ["https://placehold.co/600x400/1E2330/A0A8BE?text=No+Photo"];

  return (
    <div>
      <div className="relative aspect-[4/3] bg-surface2 rounded-[var(--radius-lg)] overflow-hidden mb-3">
        <Image
          src={displayPhotos[activePhoto]}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 66vw"
          priority
        />
        <ConditionBadge condition={condition} />
        {displayPhotos.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
            {activePhoto + 1} / {displayPhotos.length}
          </div>
        )}
      </div>
      {displayPhotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {displayPhotos.map((p, i) => (
            <button
              key={i}
              onClick={() => setActivePhoto(i)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all relative ${
                activePhoto === i
                  ? "border-brand ring-1 ring-brand/30"
                  : "border-border opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={p} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
