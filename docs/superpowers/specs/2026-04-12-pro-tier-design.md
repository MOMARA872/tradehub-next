# TradeHub Pro Tier — Design Spec

## Overview

Add a two-tier subscription system to TradeHub: **Free** and **Pro ($6.99/month)** with a 30-day free trial. Pro unlocks fixed-price listings and a trust verification badge. Payments handled via Stripe.

## Tier Comparison

| Feature | Free | Pro ($6.99/mo) |
|---|---|---|
| Post listings | yes | yes |
| Price type: free | yes | yes |
| Price type: trade | yes | yes |
| Price type: negotiable | yes | yes |
| Price type: fixed | **no** (hidden) | yes |
| Trust verification badge | no | yes |
| Free trial | — | 30 days |

## Data Model

### New columns on `profiles` table

| Column | Type | Default | Purpose |
|---|---|---|---|
| `tier` | `text` check `('free','pro')` | `'free'` | Current subscription tier |
| `stripe_customer_id` | `text` | `null` | Stripe customer ID |
| `stripe_subscription_id` | `text` | `null` | Active Stripe subscription ID |
| `subscription_status` | `text` check `('none','trialing','active','past_due','canceled')` | `'none'` | Synced from Stripe webhooks |
| `trial_ends_at` | `timestamptz` | `null` | When the 30-day free trial expires |

### Derived state

- **Is Pro**: `tier = 'pro' AND subscription_status IN ('trialing', 'active')`
- **Is Verified**: tied to Pro status. `is_verified` column updated by webhook, replacing the current manual boolean.

## Stripe Integration

### Checkout Flow

1. Free user clicks "Upgrade to Pro" in Settings
2. App calls `POST /api/stripe/checkout` which creates a Stripe Checkout Session with:
   - `mode: 'subscription'`
   - `subscription_data.trial_period_days: 30`
   - `price`: $6.99/month recurring price ID from Stripe Dashboard
   - `success_url`: `/settings?subscription=success`
   - `cancel_url`: `/settings?subscription=canceled`
   - `client_reference_id`: user's profile ID
3. User completes checkout on Stripe's hosted page
4. Stripe fires `checkout.session.completed` webhook

### Webhook Handler

**Route**: `app/api/webhooks/stripe/route.ts`

Events to handle:

| Event | Action |
|---|---|
| `checkout.session.completed` | Set `tier='pro'`, save `stripe_customer_id` + `stripe_subscription_id`, set `subscription_status='trialing'` or `'active'`, set `trial_ends_at`, set `is_verified=true` |
| `customer.subscription.updated` | Update `subscription_status` to match Stripe's status (`active`, `past_due`, `trialing`) |
| `customer.subscription.deleted` | Set `tier='free'`, `subscription_status='canceled'`, `is_verified=false`. Pause all fixed-price listings (see Downgrade section). |

### Customer Portal

Pro users get a "Manage Billing" link in Settings that redirects to Stripe's Customer Portal (hosted by Stripe). This handles card updates, cancellation, and invoice history without us building any billing UI.

## Listing Enforcement

### Post Form (client-side)

In `app/(main)/post-new/page.tsx`, the `price_type` selector hides the "Fixed Price" option entirely when the current user's `tier !== 'pro'` or `subscription_status` is not `'trialing'` or `'active'`. Users only see: Free, Trade, Negotiable.

### Server-side Guard

RLS policy on `listings` table:
- INSERT/UPDATE with `price_type = 'fixed'` requires the user's profile to have `tier = 'pro'` and `subscription_status IN ('trialing', 'active')`.
- This prevents bypassing the client-side restriction.

### Downgrade Behavior

When `customer.subscription.deleted` fires:
1. Update the user's profile: `tier='free'`, `is_verified=false`
2. Set `status='paused'` on all listings where `user_id = <user>` AND `price_type = 'fixed'`
3. Paused listings are excluded from browse/search by the existing `WHERE status = 'active'` filter
4. If user re-subscribes later, a `checkout.session.completed` webhook reactivates paused listings: `SET status='active' WHERE user_id = <user> AND status = 'paused'`

## UI Changes

### 1. Settings Page — Subscription Section

New section added to `app/(main)/settings/page.tsx`:

**Free user sees:**
- Plan: Free
- "Upgrade to Pro — $6.99/mo" button
- "Start your 30-day free trial" subtext
- Feature comparison (fixed pricing, verification badge)

**Trialing user sees:**
- Plan: Pro (Trial)
- "Trial ends on [date]" countdown
- "Manage Billing" link → Stripe Portal

**Active Pro user sees:**
- Plan: Pro
- "Manage Billing" link → Stripe Portal
- "Your subscription renews on [date]"

**Canceled user sees:**
- Plan: Free (was Pro)
- "Resubscribe to Pro" button
- Note about paused listings if any

### 2. Dashboard Banner

Dismissible banner for free-tier users on `app/(main)/dashboard/page.tsx`:

> "Upgrade to Pro for $6.99/mo — sell at fixed prices and get verified. Start your 30-day free trial."

- Dismiss stores preference in localStorage (`tradehub_dismiss_upgrade_banner`)
- Banner does not show for Pro/trialing users

### 3. Profile Verification Badge

- `VerificationBadge` component already exists and reads `isVerified`
- `is_verified` is now derived from Pro status (set/unset by webhook)
- No component changes needed — just the data source changes

### 4. Post Form — Hidden Fixed Price

- `price_type` options filtered based on `currentUser.tier` and `currentUser.subscriptionStatus`
- No lock icon, no upsell text — "Fixed Price" simply not rendered for free users

## New Files

| File | Purpose |
|---|---|
| `supabase/migrations/003_add_pro_tier.sql` | Add tier columns, RLS policy for fixed pricing |
| `app/api/stripe/checkout/route.ts` | Create Stripe Checkout Session |
| `app/api/webhooks/stripe/route.ts` | Handle Stripe webhook events |
| `lib/stripe.ts` | Stripe client initialization |
| `components/settings/SubscriptionSection.tsx` | Subscription UI for Settings page |
| `components/dashboard/UpgradeBanner.tsx` | Dismissible upgrade banner |

## Modified Files

| File | Change |
|---|---|
| `app/(main)/settings/page.tsx` | Add SubscriptionSection component |
| `app/(main)/dashboard/page.tsx` | Add UpgradeBanner component |
| `app/(main)/post-new/page.tsx` | Filter price_type options by tier |
| `lib/types/index.ts` | Add tier, subscriptionStatus, trialEndsAt to User type |
| `hooks/useAuth.ts` | Include new profile columns in user fetch |

## Environment Variables

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe server-side API key |
| `STRIPE_WEBHOOK_SECRET` | Webhook endpoint signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe key (if needed for future client components) |
| `STRIPE_PRICE_ID` | Price ID for the $6.99/mo Pro plan |

## Testing Checklist

- [ ] Free user cannot see "Fixed Price" in post form
- [ ] Free user sees upgrade banner on dashboard
- [ ] Clicking "Upgrade to Pro" redirects to Stripe Checkout with 30-day trial
- [ ] After checkout, profile shows tier=pro, subscription_status=trialing, is_verified=true
- [ ] Pro user sees "Manage Billing" in Settings
- [ ] Pro user can create fixed-price listings
- [ ] Cancellation webhook sets tier=free, pauses fixed-price listings
- [ ] Paused listings hidden from browse/search
- [ ] Re-subscription reactivates paused listings
- [ ] Webhook signature verification rejects unsigned requests
- [ ] RLS blocks fixed-price INSERT from free-tier users even if client-side is bypassed
