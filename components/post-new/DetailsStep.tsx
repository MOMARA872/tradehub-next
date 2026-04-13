"use client";

import { CONDITIONS } from "@/lib/data/conditions";
import type { ConditionKey } from "@/lib/types";

interface DetailsStepProps {
  title: string;
  description: string;
  condition: ConditionKey | "";
  conditionNotes: string;
  tagsInput: string;
  tags: string[];
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onConditionChange: (value: ConditionKey | "") => void;
  onConditionNotesChange: (value: string) => void;
  onTagsInputChange: (value: string) => void;
}

export function DetailsStep({
  title,
  description,
  condition,
  conditionNotes,
  tagsInput,
  tags,
  onTitleChange,
  onDescriptionChange,
  onConditionChange,
  onConditionNotesChange,
  onTagsInputChange,
}: DetailsStepProps) {
  return (
    <div className="animate-fade-in space-y-5">
      <h2 className="font-heading font-semibold text-lg text-foreground mb-1">
        Listing Details
      </h2>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Title <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. Vintage Leather Jacket"
          className="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-border bg-surface text-foreground text-sm placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Description <span className="text-danger">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe your item in detail..."
          rows={4}
          className="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-border bg-surface text-foreground text-sm placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Condition
        </label>
        <select
          value={condition}
          onChange={(e) => onConditionChange(e.target.value as ConditionKey | "")}
          className="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
        >
          <option value="">Select condition...</option>
          {(Object.entries(CONDITIONS) as [ConditionKey, typeof CONDITIONS[ConditionKey]][]).map(
            ([key, val]) => (
              <option key={key} value={key}>
                {val.label} — {val.description}
              </option>
            )
          )}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Condition Notes
        </label>
        <input
          type="text"
          value={conditionNotes}
          onChange={(e) => onConditionNotesChange(e.target.value)}
          placeholder="Any additional notes about the condition..."
          className="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-border bg-surface text-foreground text-sm placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Tags{" "}
          <span className="text-subtle font-normal">(comma-separated)</span>
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => onTagsInputChange(e.target.value)}
          placeholder="e.g. vintage, leather, jacket"
          className="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-border bg-surface text-foreground text-sm placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="inline-block bg-brand/10 text-brand text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
