import Link from 'next/link';
import type { Category } from '@/lib/types';
import { CategoryIcon } from '@/lib/helpers/categoryIcon';

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/browse?category=${category.id}`} className="group block">
      <div className="bg-card border border-border rounded-[var(--radius-md)] p-6 text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-brand/30 relative">
        <div className="flex justify-center mb-3"><CategoryIcon name={category.icon} className="h-8 w-8" /></div>
        <h3 className="font-heading font-semibold text-foreground text-sm mb-1">{category.name}</h3>
        <p className="text-xs text-subtle leading-relaxed">{category.description}</p>
        {category.isHot && (
          <span className="absolute top-2 right-2 bg-gradient-to-r from-brand to-brand2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            HOT
          </span>
        )}
      </div>
    </Link>
  );
}
