// components/ui/testimonials-marquee.tsx
import Image from "next/image";

export interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

export function TestimonialsColumn({
  testimonials,
  duration = 15,
  className,
}: {
  testimonials: Testimonial[];
  duration?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <div
        className="flex flex-col gap-6 pb-6"
        style={{
          animation: `marquee ${duration}s linear infinite`,
        }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex flex-col gap-6">
            {testimonials.map(({ text, image, name, role }, i) => (
              <div
                key={`${copy}-${i}`}
                className="p-8 rounded-2xl border border-border bg-card shadow-lg shadow-brand/5 max-w-xs w-full"
              >
                <div className="text-sm text-foreground leading-relaxed">{text}</div>
                <div className="flex items-center gap-2 mt-4">
                  <Image
                    width={36}
                    height={36}
                    src={image}
                    alt={name}
                    className="h-9 w-9 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div className="flex flex-col">
                    <div className="font-medium text-sm tracking-tight leading-5 text-foreground">
                      {name}
                    </div>
                    <div className="text-xs leading-5 text-subtle tracking-tight">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
