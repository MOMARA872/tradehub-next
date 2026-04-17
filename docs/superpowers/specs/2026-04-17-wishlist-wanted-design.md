# Wishlist / Want-to-Buy — Design Spec

## Overview

Users can post "Wanted" requests describing items they're looking for. Requests can be public (visible on a Wanted board) or private (personal wishlist with alerts only). Pro users get auto-matching notifications when a new listing matches their request by category.

## Data Model

### New table: `wanted_requests`

| Column | Type | Default | Purpose |
|---|---|---|---|
| `id` | uuid, PK | `gen_random_uuid()` | |
| `user_id` | uuid, FK → profiles | | Who wants it |
| `title` | text, NOT NULL | | What they're looking for |
| `description` | text | `''` | Details, condition preferences |
| `category_id` | text, FK → categories | | For matching with listings |
| `trade_type` | text, check (`buy`, `trade`, `either`) | `'either'` | How they want to acquire |
| `is_public` | boolean | `true` | Visible on Wanted board or private |
| `status` | text, check (`active`, `fulfilled`, `expired`) | `'active'` | Lifecycle |
| `created_at` | timestamptz | `now()` | |

### RLS Policies

- SELECT: public requests visible to all; private requests visible only to owner
- INSERT: `auth.uid() = user_id`
- UPDATE/DELETE: `auth.uid() = user_id`

### Indexes

- `idx_wanted_category` on `category_id` (for auto-matching queries)
- `idx_wanted_user` on `user_id`
- `idx_wanted_status` on `status`

## Pages & UI

### 1. Wanted Board (`/wanted`)

New page showing public want-to-buy requests.

- Grid of request cards showing: title, category badge, trade type badge, author avatar + name, time ago
- Category filter chips (reuse pattern from browse/community pages)
- "Post a Request" button (auth-gated, hidden for logged-out users)
- Each card has an "I have this!" button that starts a message thread with the requester (reuse existing messaging system — create a thread linked to the wanted request)
- Sort: newest first

### 2. New Request Modal

Dialog form triggered by "Post a Request" button.

Fields:
- **Title** (required, text input)
- **Description** (optional, textarea, max 500 chars)
- **Category** (required, select from existing categories)
- **Trade type** (required, radio/button group: Buy / Trade / Either)
- **Visibility** (toggle: Public or Private)

On submit: insert into `wanted_requests` via Supabase client. Refresh the Wanted board on success.

### 3. My Wishlist (Dashboard section)

Add a "My Wishlist" section to the dashboard page showing:
- List of user's active requests (both public and private)
- Status badges (active / fulfilled)
- "Mark as Fulfilled" and "Delete" actions
- Link to create new request

### 4. Navigation

Add "Wanted" link to the navbar `userPages` array (visible to all users, not just logged-in).

Also add "Wanted" to the main navigation `pages` array so it appears in the top nav.

## Auto-Matching (Pro Only)

### Trigger

When a new listing is created (in the post-new submit handler), after successful insert:

1. Query `wanted_requests` where:
   - `category_id` matches the new listing's `category_id`
   - `status = 'active'`
2. For each matching request where the requester has `tier = 'pro'` and `subscription_status IN ('active', 'trialing')`:
   - Insert notification: type `'wishlist_match'`, title "A new listing matches your request!", body includes listing title, link to the listing
3. For the seller (if Pro):
   - Insert notification: type `'wanted_match'`, title "Someone is looking for items like yours!", body includes request title, link to `/wanted`

### Pro Gating

| Feature | Free | Pro |
|---|---|---|
| Post public requests | yes | yes |
| Post private requests | yes | yes |
| Browse Wanted board | yes | yes |
| "I have this!" respond | yes | yes |
| Auto-match notifications | **no** | **yes** |

Free users can fully use the Wanted board manually. The Pro perk is automatic notification matching — they don't have to check the board themselves.

## New Files

| File | Purpose |
|---|---|
| `app/(main)/wanted/page.tsx` | Wanted board page |
| `components/wanted/NewRequestModal.tsx` | Create request form dialog |
| `components/wanted/RequestCard.tsx` | Individual request card component |

## Modified Files

| File | Change |
|---|---|
| `components/layout/Navbar.tsx` | Add "Wanted" to navigation |
| `app/(main)/dashboard/page.tsx` | Add "My Wishlist" section |
| `app/(main)/post-new/page.tsx` | Add auto-matching after listing creation (Pro only) |
| `lib/types/index.ts` | Add NotificationType variants for wishlist/wanted matches |

## Testing Checklist

- [ ] Visit `/wanted` — see public requests with category badges and author info
- [ ] Click "Post a Request" — modal opens with title, description, category, trade type, visibility
- [ ] Submit a public request — appears on the Wanted board
- [ ] Submit a private request — does NOT appear on Wanted board, visible in Dashboard wishlist
- [ ] Click "I have this!" on a request — opens/creates a message thread with the requester
- [ ] As a Pro user, create a listing matching a wanted request's category — both parties get notifications
- [ ] As a free user, same action — no auto-match notifications sent
- [ ] Dashboard shows "My Wishlist" with active requests, fulfill/delete actions
- [ ] "Wanted" link visible in navbar
