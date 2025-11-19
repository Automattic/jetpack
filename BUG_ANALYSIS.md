# Bug Analysis: Coupon Redemption Broken (MYJP-270)

## Issue Summary
Partner coupons cannot be redeemed when accessing `../wp-admin/admin.php?page=jetpack&showCouponRedemption=1#/dashboard`. The coupon redemption modal does not appear.

## Root Cause

### 1. Dashboard Removal (MYJP-235)
According to the comments in the issue, the Jetpack Dashboard link was removed from the admin menu in MYJP-235. This change affects the coupon redemption flow.

### 2. Redirect Flow Problem
When `My_Jetpack_Initializer::should_initialize()` returns true (which happens when My Jetpack package is available), users accessing `admin.php?page=jetpack` are redirected to My Jetpack instead. The problem is that the `showCouponRedemption` query parameter gets lost during this process.

**Evidence from code:**

**File:** `projects/plugins/jetpack/class.jetpack.php` (lines 6157-6158)
```php
} elseif ( My_Jetpack_Initializer::should_initialize() ) {
    $redirect_url = static::admin_url( 'page=my-jetpack' );
```

**File:** `projects/plugins/jetpack/_inc/lib/admin-pages/class.jetpack-react-page.php` (lines 89-99)
The Jetpack menu item gets removed when My Jetpack is available, making the dashboard inaccessible via menu navigation.

### 3. Partner Coupon Flow
The partner coupon redemption works in the Jetpack React page:

**File:** `projects/plugins/jetpack/_inc/client/main.jsx` (lines 390-423)
```javascript
if ( this.props.partnerCoupon ) {
    const forceShow = new URLSearchParams( window.location.search ).get( 'showCouponRedemption' );
    
    if ( ! this.props.isOfflineMode && ( ! this.props.isSiteConnected || forceShow ) ) {
        return (
            <PartnerCouponRedeem
                // ... props
            />
        );
    }
}
```

This code specifically checks for the `showCouponRedemption` parameter to force-show the partner coupon redemption screen even on connected sites.

### 4. My Jetpack Lacks Partner Coupon Support
**Critical Finding:** My Jetpack package (`projects/packages/my-jetpack/`) has NO code that handles partner coupons or the `showCouponRedemption` parameter. When users are redirected to My Jetpack, the coupon redemption functionality is completely unavailable.

## Proposed Solution

We need to implement a two-part fix:

### Part 1: Preserve Query Parameters During Redirect
When redirecting from Jetpack to My Jetpack, preserve the `showCouponRedemption` parameter (and potentially `partnerCoupon` as well).

**Location:** `projects/plugins/jetpack/_inc/lib/admin-pages/class.jetpack-react-page.php`

### Part 2: Implement Partner Coupon Support in My Jetpack
Add partner coupon redemption functionality to My Jetpack:

1. **Backend (PHP):**
   - Pass partner coupon data to My Jetpack's initial state
   - Check for `showCouponRedemption` parameter
   - File: `projects/packages/my-jetpack/src/class-initializer.php`

2. **Frontend (React):**
   - Create a new route or modal for partner coupon redemption
   - Check for `showCouponRedemption` parameter in URL
   - Display the partner coupon redemption UI
   - File: `projects/packages/my-jetpack/_inc/admin.jsx`

### Alternative Solution (Simpler)
Instead of redirecting to My Jetpack when `showCouponRedemption=1` is present, keep the user on the Jetpack page to allow the existing coupon redemption flow to work.

**Location:** `projects/plugins/jetpack/_inc/lib/admin-pages/class.jetpack-react-page.php` (in the `remove_jetpack_menu()` method or before the redirect logic)

## Implementation Plan

### Option A: Quick Fix (Recommended for MVP)
**Prevent redirect when showCouponRedemption parameter is present**

1. Modify `class.jetpack-react-page.php` to check for `showCouponRedemption` parameter
2. If present, don't remove the Jetpack menu item and don't redirect to My Jetpack
3. Allow the existing Jetpack coupon redemption flow to work

### Option B: Full Implementation
**Add partner coupon support to My Jetpack**

1. Update redirect logic to preserve query parameters
2. Add partner coupon data to My Jetpack initial state
3. Create partner coupon redemption component in My Jetpack
4. Add route/modal handling for coupon redemption
5. Test the complete flow

## Files to Modify

### Option A (Quick Fix):
1. `projects/plugins/jetpack/_inc/lib/admin-pages/class.jetpack-react-page.php`

### Option B (Full Implementation):
1. `projects/plugins/jetpack/_inc/lib/admin-pages/class.jetpack-react-page.php`
2. `projects/packages/my-jetpack/src/class-initializer.php`
3. `projects/packages/my-jetpack/_inc/admin.jsx`
4. `projects/packages/my-jetpack/_inc/components/partner-coupon-screen/index.tsx` (new file)

## Testing Requirements

1. Test with partner coupon set and `showCouponRedemption=1` parameter
2. Test without My Jetpack available (backward compatibility)
3. Test with My Jetpack available (new flow)
4. Test both connected and unconnected sites
5. Verify coupon redemption completes successfully
6. Verify redirect behavior after redemption
