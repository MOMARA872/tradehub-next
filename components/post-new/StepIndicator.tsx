"use client";

import { Check } from "lucide-react";

const STEPS = [
  { number: 1, label: "Category" },
  { number: 2, label: "Photos" },
  { number: 3, label: "Details" },
  { number: 4, label: "Pricing" },
  { number: 5, label: "Review" },
];

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
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
