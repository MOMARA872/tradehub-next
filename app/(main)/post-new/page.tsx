"use client";

import { CONDITIONS } from "@/lib/data/conditions";
import { REGIONS } from "@/lib/data/regions";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/helpers/format";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Lock,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import type { ConditionKey, Category } from "@/lib/types";
import { toast } from "sonner";

function StepShimmer() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-surface3 rounded w-1/3" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 bg-surface3 rounded-[var(--radius-md)]" />
        ))}
      </div>
    </div>
  );
}

const StepIndicator = dynamic(
  () => import("@/components/post-new/StepIndicator").then((m) => m.StepIndicator),
  { ssr: false, loading: () => <div className="h-16 mb-10" /> }
);

const CategoryStep = dynamic(
  () => import("@/components/post-new/CategoryStep").then((m) => m.CategoryStep),
  { ssr: false, loading: () => <StepShimmer /> }
);

const PhotosStep = dynamic(
  () => import("@/components/post-new/PhotosStep").then((m) => m.PhotosStep),
  { ssr: false, loading: () => <StepShimmer /> }
);

const DetailsStep = dynamic(
  () => import("@/components/post-new/DetailsStep").then((m) => m.DetailsStep),
  { ssr: false, loading: () => <StepShimmer /> }
);

const PricingStep = dynamic(
  () => import("@/components/post-new/PricingStep").then((m) => m.PricingStep),
  { ssr: false, loading: () => <StepShimmer /> }
);

const ReviewStep = dynamic(
  () => import("@/components/post-new/ReviewStep").then((m) => m.ReviewStep),
  { ssr: false, loading: () => <StepShimmer /> }
);

function PostNewWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const preselectedCategory = searchParams.get("category") || "";

  const { currentUser } = useAuth();
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
  const [zipCode, setZipCode] = useState("");

  const tags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

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
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const resolvedSubcategory =
        selectedSubcategory === "__other__" ? customSubcategory.trim() : selectedSubcategory;

      // Derive lat/lng from the selected city region + small jitter so
      // listings don't stack on exact city center.
      const selectedCity = citiesFiltered.find((r) => r.id === city);
      const jitterLat = (Math.random() - 0.5) * 0.04;
      const jitterLng = (Math.random() - 0.5) * 0.04;

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
          city: city || (zipCode.trim() ? "" : "Prescott, AZ"),
          zip_code: zipCode.trim(),
          lat: selectedCity ? selectedCity.lat + jitterLat : null,
          lng: selectedCity ? selectedCity.lng + jitterLng : null,
          location_confirmed: false,
          photos: photos.length > 0 ? photos : [],
          tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
        })
        .select("id")
        .single();

      if (insertError || !data) {
        setError(insertError?.message ?? "Failed to create listing. Please try again.");
        return;
      }

      toast.success("Listing posted!", { description: "Redirecting to your listing..." });
      router.push(`/listing/${data.id}`);
    } finally {
      setSubmitting(false);
    }
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
        <div className="flex justify-center mb-4"><Lock className="h-12 w-12 text-muted" /></div>
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
        <CategoryStep
          categories={categories}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          customSubcategory={customSubcategory}
          onSelectCategory={(id) => {
            setSelectedCategory(id);
            setSelectedSubcategory("");
          }}
          onSelectSubcategory={(sub) => {
            setSelectedSubcategory(sub);
            if (sub !== "__other__") setCustomSubcategory("");
          }}
          onCustomSubcategoryChange={setCustomSubcategory}
        />
      )}

      {/* Step 2: Photos */}
      {currentStep === 2 && (
        <PhotosStep
          currentUserId={currentUserId}
          photos={photos}
          onPhotosChange={setPhotos}
        />
      )}

      {/* Step 3: Details */}
      {currentStep === 3 && (
        <DetailsStep
          title={title}
          description={description}
          condition={condition}
          conditionNotes={conditionNotes}
          tagsInput={tagsInput}
          tags={tags}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onConditionChange={setCondition}
          onConditionNotesChange={setConditionNotes}
          onTagsInputChange={setTagsInput}
        />
      )}

      {/* Step 4: Pricing */}
      {currentStep === 4 && (
        <PricingStep
          priceType={priceType}
          price={price}
          city={city}
          zipCode={zipCode}
          onPriceTypeChange={setPriceType}
          onPriceChange={setPrice}
          onCityChange={setCity}
          onZipCodeChange={setZipCode}
        />
      )}

      {/* Step 5: Review & Submit */}
      {currentStep === 5 && (
        <ReviewStep
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          customSubcategory={customSubcategory}
          categories={categories}
          photos={photos}
          title={title}
          description={description}
          condition={condition}
          conditionNotes={conditionNotes}
          tags={tags}
          priceType={priceType}
          price={price}
          city={city}
          onGoToStep={handleGoToStep}
        />
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
