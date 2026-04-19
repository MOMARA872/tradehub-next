# Add Photos to Existing Listings

## Problem

Listing owners cannot add photos after creating a listing. If they forgot to upload photos or want to add more later, they have no way to do so from the listing detail page.

## Solution

Add an inline "Add Photos" button to the `PhotoGallery` component, visible only to the listing owner. Clicking it opens a file picker, uploads selected images to Supabase storage, appends the new URLs to the listing's `photos` array, and refreshes the gallery.

## Design

### PhotoGallery Changes

**File:** `components/listing/PhotoGallery.tsx`

Add two optional props:

- `canEdit?: boolean` - whether to show the add button (true only for listing owner)
- `onAddPhotos?: (files: FileList) => Promise<void>` - callback that handles upload

**UI placement:**

- If photos exist: show an "Add Photos" button (camera icon) after the thumbnail strip
- If no photos: show the button in the empty state area alongside the listing title
- Hide the button if already at 10 photos (max limit)
- Show a loading spinner on the button while upload is in progress

### Listing Detail Page Changes

**File:** `app/(main)/listing/[id]/page.tsx`

When the logged-in user is the listing owner:

1. Pass `canEdit={true}` and `onAddPhotos={handleAddPhotos}` to `PhotoGallery`
2. `handleAddPhotos` implementation:
   - Validate each file: JPEG/PNG/WebP only, max 50MB
   - Upload to Supabase storage bucket `listing-photos` at path `{userId}/{uuid}.{ext}`
   - Get public URLs via `getPublicUrl()`
   - Append new URLs to existing `photos` array: `UPDATE listings SET photos = photos || newUrls WHERE id = listingId`
   - Reload page to refresh the gallery

### Reused Code

- Upload validation (file type, size) from `components/listing/PhotoUpload.tsx`
- Storage bucket `listing-photos` already configured with RLS policies (users can upload to their own folder)
- `next.config.ts` already allows Supabase storage image URLs

### Constraints

- Max 10 photos per listing total
- Accepted formats: JPEG, PNG, WebP
- Max file size: 50MB per file
- Owner-only: `canEdit` gated by `currentUserId === listing.user_id`
- Add only: no delete or reorder in this feature

## Verification

1. `npx tsc --noEmit` passes
2. As listing owner: visit own listing, see "Add Photos" button, upload a photo, gallery updates
3. As non-owner: visit same listing, no "Add Photos" button visible
4. Upload at 10 photos: button hidden or disabled
5. Invalid file type (e.g. PDF): shows error, no upload
