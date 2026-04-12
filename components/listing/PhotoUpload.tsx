"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { X, Upload } from "lucide-react";

interface PhotoUploadProps {
  userId: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoUpload({ userId, photos, onPhotosChange, maxPhotos = 6 }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError("");
    setUploading(true);

    const newPhotos: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Each photo must be under 5MB");
        continue;
      }

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Only JPEG, PNG, and WebP files are allowed");
        continue;
      }

      const ext = file.name.split(".").pop();
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-photos")
        .upload(path, file);

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("listing-photos")
        .getPublicUrl(path);

      newPhotos.push(publicUrl);
    }

    if (newPhotos.length > 0) {
      const updated = [...photos, ...newPhotos].slice(0, maxPhotos);
      onPhotosChange(updated);
    }

    setUploading(false);
    e.target.value = "";
  }

  function removePhoto(index: number) {
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        {photos.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
            <Image src={url} alt={`Photo ${i + 1}`} fill unoptimized className="object-cover" sizes="120px" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-brand/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
            <Upload className="h-5 w-5 text-muted mb-1" />
            <span className="text-[10px] text-muted">
              {uploading ? "Uploading..." : "Add Photo"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && <p className="text-xs text-danger mt-1">{error}</p>}
      <p className="text-[10px] text-subtle">{photos.length}/{maxPhotos} photos. Max 5MB each.</p>
    </div>
  );
}
