"use client";

import { PhotoUpload } from "@/components/listing/PhotoUpload";

interface PhotosStepProps {
  currentUserId: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

export function PhotosStep({ currentUserId, photos, onPhotosChange }: PhotosStepProps) {
  return (
    <div className="animate-fade-in">
      <h2 className="font-heading font-semibold text-lg text-foreground mb-4">
        Add Photos
      </h2>
      <PhotoUpload
        userId={currentUserId}
        photos={photos}
        onPhotosChange={onPhotosChange}
        maxPhotos={10}
      />
    </div>
  );
}
