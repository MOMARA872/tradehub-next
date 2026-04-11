"use client";

import { CONDITIONS } from "@/lib/data/conditions";
import { REGIONS } from "@/lib/data/regions";
import { createClient } from "@/lib/supabase/client";
import { PhotoUpload } from "@/components/listing/PhotoUpload";
import { formatPrice } from "@/lib/helpers/format";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import type { ConditionKey, Category } from "@/lib/types";

const STEPS = [
  { number: 1, label: "Category" },
  { number: 2, label: "Photos" },
  { number: 3, label: "Details" },
  { number: 4, label: "Pricing" },
  { number: 5, label: "Review" },
];

const PRICE_TYPES = [
  { value: "fixed", label: "Fixed Price" },
  { value: "negotiable", label: "Negotiable" },
  { value: "trade", label: "Trade" },
  { value: "free", label: "Free" },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                currentStep === step.number
                  ? "bg-brand text-white"
                  : currentStep > step.number
                  ? "bg-success text-white"
                  : "bg-surface3 text-subtle"
              }`}
            >
              {currentStep > step.number ? (
                <Check className="w-4 h-4" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={`text-xs mt-1.5 whitespace-nowrap ${
                currentStep === step.number
                  ? "text-brand font-semibold"
                  : currentStep > step.number
                  ? "text-success font-medium"
                  : "text-subtle"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={`w-12 sm:w-20 h-0.5 mx-1 sm:mx-2 mb-5 ${
                currentStep > step.number ? "bg-success" : "bg-surface3"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function PostNewWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const preselectedCategory = searchParams.get("category") || "";

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Category
  const [selectedCategory, setSelectedCategory] = useState(preselectedCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [customSubcategory, setCustomSubcategory] = useState("");

  // Step 2: Photos
  const [photos, setPhotos] = useState<string[]>([]);

  // Step 3: Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<ConditionKey | "">("");
  const [conditionNotes, setConditionNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // Step 4: Pricing
  const [priceType, setPriceType] = useState("fixed");
  const [price, setPrice] = useState<number>(0);
  const [city, setCity] = useState("");

  const tags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const categoryData = categories.find((c) => c.id === selectedCategory);
  const conditionData = condition ? CONDITIONS[condition] : null;
  const cityData = REGIONS.find((r) => r.id === city);
  const citiesFiltered = REGIONS.filter((r) => r.id !== "all");

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
      setAuthLoading(false);
    });

    // Fetch categories from Supabase
    supabase
      .from("categories")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) {
          setCategories(
            data.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              icon: c.icon,
              description: c.description,
              isHot: c.is_hot,
              subcategories: c.subcategories ?? [],
            }))
          );
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validateStep(): boolean {
    setError("");
    if (currentStep === 1) {
      if (!selectedCategory) {
        setError("Please select a category.");
        return false;
      }
      if (!selectedSubcategory) {
        setError("Please select a subcategory.");
        return false;
      }
      if (selectedSubcategory === "__other__" && !customSubcategory.trim()) {
        setError("Please type your subcategory.");
        return false;
      }
    }
    if (currentStep === 3) {
      if (!title.trim()) {
        setError("Please enter a title.");
        return false;
      }
      if (!description.trim()) {
        setError("Please enter a description.");
        return false;
      }
    }
    return true;
  }

  function handleNext() {
    if (!validateStep()) return;
    setCurrentStep((s) => Math.min(s + 1, 5));
  }

  function handleBack() {
    setError("");
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  function handleGoToStep(step: number) {
    setError("");
    setCurrentStep(step);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const resolvedSubcategory =
      selectedSubcategory === "__other__" ? customSubcategory.trim() : selectedSubcategory;

    const { data, error: insertError } = await supabase
      .from("listings")
      .insert({
        user_id: user.id,
        category_id: selectedCategory,
        subcategory: resolvedSubcategory,
        title: title.trim(),
        description: description.trim(),
        price: priceType === "free" || priceType === "trade" ? 0 : parseFloat(String(price)) || 0,
        price_type: priceType,
        condition: (condition || "good") as ConditionKey,
        condition_notes: conditionNotes.trim(),
        city: city || "Prescott, AZ",
        photos: photos.length > 0 ? photos : [],
        tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    router.push(`/listing/${data.id}`);
  }

  if (authLoading) {
    return (
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
        <p className="text-muted text-sm mt-3">Loading...</p>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
          Sign in to post a listing
        </h1>
        <p className="text-muted text-sm mb-6">
          You need to be logged in to create a new listing.
        </p>
        <Link
          href="/login"
          className="inline-block bg-brand text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground text-center mb-2">
        Post a New Listing
      </h1>
      <p className="text-muted text-sm text-center mb-8">
        Fill out the steps below to create your listing.
      </p>

      <StepIndicator currentStep={currentStep} />

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-[var(--radius-md)] px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Step 1: Category */}
      {currentStep === 1 && (
        <div className="animate-fade-in">
          <h2 className="font-heading font-semibold text-lg text-foreground mb-4">
            Choose a Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubcategory("");
                }}
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
                      onChange={() => {
                        setSelectedSubcategory(sub);
                        setCustomSubcategory("");
                      }}
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
                    onChange={() => setSelectedSubcategory("__other__")}
                    className="accent-[var(--color-brand)]"
                  />
                  <span className="text-sm text-foreground">Other</span>
                </label>
                {selectedSubcategory === "__other__" && (
                  <div className="ml-7 animate-fade-in">
                    <input
                      type="text"
                      value={customSubcategory}
                      onChange={(e) => setCustomSubcategory(e.target.value)}
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
      )}

      {/* Step 2: Photos */}
      {currentStep === 2 && (
        <div className="animate-fade-in">
          <h2 className="font-heading font-semibold text-lg text-foreground mb-4">
            Add Photos
          </h2>
          <PhotoUpload
            userId={currentUserId}
            photos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={10}
          />
        </div>
      )}

      {/* Step 3: Details */}
      {currentStep === 3 && (
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
              onChange={(e) => setTitle(e.target.value)}
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
              onChange={(e) => setDescription(e.target.value)}
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
              onChange={(e) => setCondition(e.target.value as ConditionKey | "")}
              className="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
            >
              <option value="">Select condition...</option>
              {(Object.entries(CONDITIONS) as [ConditionKey, typeof CONDITIONS[ConditionKey]][]).map(
                ([key, val]) => (
                  <option key={key} value={key}>
                    {val.emoji} {val.label} — {val.description}
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
              onChange={(e) => setConditionNotes(e.target.value)}
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
              onChange={(e) => setTagsInput(e.target.value)}
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
      )}

      {/* Step 4: Pricing */}
      {currentStep === 4 && (
        <div className="animate-fade-in space-y-5">
          <h2 className="font-heading font-semibold text-lg text-foreground mb-1">
            Pricing &amp; Location
          </h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2.5">
              Price Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRICE_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setPriceType(pt.value)}
                  className={`px-4 py-2.5 rounded-[var(--radius-md)] border text-sm font-medium transition-all cursor-pointer ${
                    priceType === pt.value
                      ? "border-brand bg-brand/10 text-brand ring-2 ring-brand"
                      : "border-border bg-surface text-foreground hover:border-muted"
                  }`}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {(priceType === "fixed" || priceType === "negotiable") && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Price ($)
              </label>
              <input
                type="number"
                value={price || ""}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="0.00"
                min={0}
                step={0.01}
                className="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-border bg-surface text-foreground text-sm placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              City / Region
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[var(--radius-md)] border border-border bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand"
            >
              <option value="">Select a city...</option>
              {citiesFiltered.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Step 5: Review & Submit */}
      {currentStep === 5 && (
        <div className="animate-fade-in">
          <h2 className="font-heading font-semibold text-lg text-foreground mb-5">
            Review Your Listing
          </h2>

          <div className="bg-card border border-border rounded-[var(--radius-md)] divide-y divide-border">
            {/* Category */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs text-subtle uppercase tracking-wide mb-0.5">
                  Category
                </p>
                <p className="text-sm text-foreground font-medium">
                  {categoryData?.icon} {categoryData?.name}
                  {selectedSubcategory && (
                    <span className="text-muted"> / {selectedSubcategory === "__other__" ? customSubcategory : selectedSubcategory}</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGoToStep(1)}
                className="text-xs text-brand font-medium hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>

            {/* Photos */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs text-subtle uppercase tracking-wide mb-0.5">
                  Photos
                </p>
                <p className="text-sm text-foreground font-medium">
                  {photos.length} photo{photos.length !== 1 ? "s" : ""} uploaded
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGoToStep(2)}
                className="text-xs text-brand font-medium hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>

            {/* Title & Description */}
            <div className="flex items-start justify-between px-5 py-4">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-xs text-subtle uppercase tracking-wide mb-0.5">
                  Title
                </p>
                <p className="text-sm text-foreground font-medium">
                  {title || <span className="text-subtle italic">Not set</span>}
                </p>
                <p className="text-xs text-subtle uppercase tracking-wide mt-3 mb-0.5">
                  Description
                </p>
                <p className="text-sm text-muted truncate">
                  {description
                    ? description.length > 120
                      ? description.substring(0, 120) + "..."
                      : description
                    : "Not set"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGoToStep(3)}
                className="text-xs text-brand font-medium hover:underline cursor-pointer flex-shrink-0"
              >
                Edit
              </button>
            </div>

            {/* Condition */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs text-subtle uppercase tracking-wide mb-0.5">
                  Condition
                </p>
                <p className="text-sm text-foreground font-medium">
                  {conditionData ? (
                    <>
                      {conditionData.emoji} {conditionData.label}
                      {conditionNotes && (
                        <span className="text-muted font-normal">
                          {" "}
                          — {conditionNotes}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-subtle italic">Not set</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGoToStep(3)}
                className="text-xs text-brand font-medium hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>

            {/* Pricing */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs text-subtle uppercase tracking-wide mb-0.5">
                  Price
                </p>
                <p className="text-sm text-foreground font-medium">
                  {priceType === "free" || priceType === "trade"
                    ? formatPrice(0, priceType as "fixed" | "free" | "trade" | "negotiable")
                    : price > 0
                    ? `${formatPrice(price, priceType as "fixed" | "free" | "trade" | "negotiable")}${
                        priceType === "negotiable" ? " (Negotiable)" : ""
                      }`
                    : "Not set"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGoToStep(4)}
                className="text-xs text-brand font-medium hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>

            {/* City */}
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs text-subtle uppercase tracking-wide mb-0.5">
                  Location
                </p>
                <p className="text-sm text-foreground font-medium">
                  {cityData?.name || (
                    <span className="text-subtle italic">Not set</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGoToStep(4)}
                className="text-xs text-brand font-medium hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex items-start justify-between px-5 py-4">
                <div>
                  <p className="text-xs text-subtle uppercase tracking-wide mb-1.5">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-block bg-brand/10 text-brand text-xs font-medium px-2.5 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleGoToStep(3)}
                  className="text-xs text-brand font-medium hover:underline cursor-pointer flex-shrink-0"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] border border-border bg-card text-foreground text-sm font-medium hover:bg-surface transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-md)] bg-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius-md)] bg-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Submit Listing
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PostNewPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
          <p className="text-muted text-sm mt-3">Loading...</p>
        </div>
      }
    >
      <PostNewWizard />
    </Suspense>
  );
}
