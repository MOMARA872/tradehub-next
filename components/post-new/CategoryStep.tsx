"use client";

import type { Category } from "@/lib/types";

interface CategoryStepProps {
  categories: Category[];
  selectedCategory: string;
  selectedSubcategory: string;
  customSubcategory: string;
  onSelectCategory: (id: string) => void;
  onSelectSubcategory: (sub: string) => void;
  onCustomSubcategoryChange: (value: string) => void;
}

export function CategoryStep({
  categories,
  selectedCategory,
  selectedSubcategory,
  customSubcategory,
  onSelectCategory,
  onSelectSubcategory,
  onCustomSubcategoryChange,
}: CategoryStepProps) {
  const categoryData = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="animate-fade-in">
      <h2 className="font-heading font-semibold text-lg text-foreground mb-4">
        Choose a Category
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-[var(--radius-md)] border transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? "ring-2 ring-brand border-brand bg-brand/5"
                : "border-border bg-card hover:border-muted"
            }`}
          >
            <span className="text-2xl">{cat.icon}</span>
            <span className="text-sm font-medium text-foreground">
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      {categoryData && (
        <div className="bg-card border border-border rounded-[var(--radius-md)] p-5 animate-fade-in">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-3">
            Select a Subcategory for{" "}
            <span className="text-brand">{categoryData.name}</span>
          </h3>
          <div className="flex flex-col gap-2">
            {categoryData.subcategories.map((sub) => (
              <label
                key={sub}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                  selectedSubcategory === sub
                    ? "border-brand bg-brand/5"
                    : "border-border bg-surface hover:border-muted"
                }`}
              >
                <input
                  type="radio"
                  name="subcategory"
                  value={sub}
                  checked={selectedSubcategory === sub}
                  onChange={() => onSelectSubcategory(sub)}
                  className="accent-[var(--color-brand)]"
                />
                <span className="text-sm text-foreground">{sub}</span>
              </label>
            ))}
            {/* Other — custom subcategory */}
            <label
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                selectedSubcategory === "__other__"
                  ? "border-brand bg-brand/5"
                  : "border-border bg-surface hover:border-muted"
              }`}
            >
              <input
                type="radio"
                name="subcategory"
                value="__other__"
                checked={selectedSubcategory === "__other__"}
                onChange={() => onSelectSubcategory("__other__")}
                className="accent-[var(--color-brand)]"
              />
              <span className="text-sm text-foreground">Other</span>
            </label>
            {selectedSubcategory === "__other__" && (
              <div className="ml-7 animate-fade-in">
                <input
                  type="text"
                  value={customSubcategory}
                  onChange={(e) => onCustomSubcategoryChange(e.target.value)}
                  placeholder="Type your subcategory..."
                  autoFocus
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
