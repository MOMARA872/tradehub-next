"use client"

import { TextRotate } from "@/components/ui/text-rotate"

export function HeroTextRotate() {
  return (
    <TextRotate
      texts={["Connect", "Barter", "Share", "Thrive", "Swap"]}
      mainClassName="bg-brand text-white px-3 sm:px-4 py-1 sm:py-2 rounded-xl overflow-hidden justify-center min-w-[8rem]"
      staggerFrom="last"
      staggerDuration={0.025}
      splitLevelClassName="overflow-hidden"
      transition={{ type: "spring", damping: 30, stiffness: 400 }}
      rotationInterval={2500}
    />
  )
}
