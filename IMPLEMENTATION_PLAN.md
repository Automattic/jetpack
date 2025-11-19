# Implementation Plan: Fix Partner Coupon Redemption

## Strategy: Option A - Quick Fix (Recommended)

We'll prevent the redirect to My Jetpack when the `showCouponRedemption` parameter is present, allowing the existing Jetpack coupon redemption flow to work.

## Code Changes

### 1. Modify `class.jetpack-react-page.php` - `remove_jetpack_menu()` method

**Location:** `projects/plugins/jetpack/_inc/lib/admin-pages/class.jetpack-react-page.php`

**Current code (lines 89-100):**
```php
public function remove_jetpack_menu() {
    $is_offline_mode = ( new Status() )->is_offline_mode();
    $has_my_jetpack  = (
        class_exists( 'Automattic\Jetpack\My_Jetpack\Initializer' ) &&
        method_exists( 'Automattic\Jetpack\My_Jetpack\Initializer', 'should_initialize' ) &&
        \Automattic\Jetpack\My_Jetpack\Initializer::should_initialize()
    );

    if ( $is_offline_mode || $has_my_jetpack || Jetpack::is_connection_ready() ) {
        remove_submenu_page( 'jetpack', 'jetpack' );
    }
}
```

**New code:**
```php
public function remove_jetpack_menu() {
    $is_offline_mode = ( new Status() )->is_offline_mode();
    $has_my_jetpack  = (
        class_exists( 'Automattic\Jetpack\My_Jetpack\Initializer' ) &&
        method_exists( 'Automattic\Jetpack\My_Jetpack\Initializer', 'should_initialize' ) &&
        \Automattic\Jetpack\My_Jetpack\Initializer::should_initialize()
    );

    // Check if we're in partner coupon redemption flow
    // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Just checking if parameter exists
    $show_coupon_redemption = isset( $_GET['showCouponRedemption'] );

    // Don't remove the menu if we need to show partner coupon redemption
    if ( $show_coupon_redemption ) {
        return;
    }

    if ( $is_offline_mode || $has_my_jetpack || Jetpack::is_connection_ready() ) {
        remove_submenu_page( 'jetpack', 'jetpack' );
    }
}
```

### 2. Modify `class.jetpack-react-page.php` - `add_page_actions()` method

**Consideration:** The `add_page_actions()` method handles page redirection. We should ensure that when `showCouponRedemption` is present, the page renders normally without redirecting to modules page.

The method already has logic at lines 51-62 that handles the 'jetpack' page. We don't need to modify this as it only redirects for sub-pages like `jetpack/settings`.

### 3. Additional consideration - Partner Coupon package

**Location:** `projects/packages/connection/src/class-partner-coupon.php` (line 152)

The code that adds the `showCouponRedemption` parameter is already correct:
```php
$redirect_location = add_query_arg( array( 'showCouponRedemption' => 1 ), $redirect_location );
```

This adds the parameter when redirecting to the Jetpack dashboard after a partner coupon is set.

## Alternative Implementation: Option B (Full Integration)

If we want a more comprehensive solution that works seamlessly with My Jetpack, we would:

### 1. Pass query parameters during post-activation redirect

**Location:** `projects/plugins/jetpack/class.jetpack.php` (line 6158)

**Current:**
```php
} elseif ( My_Jetpack_Initializer::should_initialize() ) {
    $redirect_url = static::admin_url( 'page=my-jetpack' );
```

**New:**
```php
} elseif ( My_Jetpack_Initializer::should_initialize() ) {
    $redirect_url = static::admin_url( 'page=my-jetpack' );
    
    // Preserve showCouponRedemption parameter if present
    // phpcs:ignore WordPress.Security.NonceVerification.Recommended
    if ( isset( $_GET['showCouponRedemption'] ) ) {
        $redirect_url = add_query_arg( 'showCouponRedemption', '1', $redirect_url );
    }
```

### 2. Handle in My Jetpack Initializer

**Location:** `projects/packages/my-jetpack/src/class-initializer.php` (around line 195)

Add logic to detect `showCouponRedemption` and redirect back to Jetpack page:

```php
// In the add_page_actions method, after line 193
// Check if partner coupon redemption is requested
// phpcs:ignore WordPress.Security.NonceVerification.Recommended
if ( isset( $_GET['showCouponRedemption'] ) && '1' === $_GET['showCouponRedemption'] ) {
    // Redirect to Jetpack page to handle partner coupon
    wp_safe_redirect( admin_url( 'admin.php?page=jetpack&showCouponRedemption=1#/dashboard' ) );
    exit( 0 );
}
```

### 3. Import Partner Coupon package in My Jetpack (Future Enhancement)

This would involve:
- Adding `@automattic/jetpack-partner-coupon` as a dependency
- Creating a new route in `_inc/admin.jsx`
- Building a partner coupon screen component
- Passing partner coupon data through initial state

This is a larger effort and should be considered for a future iteration.

## Recommendation

**Implement Option A (Quick Fix)** for the immediate issue, which:
- ✅ Fixes the bug with minimal code changes
- ✅ Maintains backward compatibility
- ✅ Doesn't break existing My Jetpack functionality
- ✅ Uses the existing, tested partner coupon redemption flow
- ✅ Low risk of introducing new bugs

**Consider Option B for future roadmap** if:
- My Jetpack becomes the primary admin interface
- Partner coupon flow needs to be modernized
- More integration between My Jetpack and partner features is needed

## Testing Plan

1. **Setup:**
   - Install Jetpack with My Jetpack package
   - Set up a partner coupon in the database

2. **Test Cases:**
   - Navigate to `admin.php?page=jetpack&showCouponRedemption=1`
   - Verify the partner coupon redemption screen appears
   - Complete the redemption flow
   - Verify the Jetpack menu item is visible during redemption
   - Test without the parameter to ensure My Jetpack still loads normally
   - Test on both connected and unconnected sites

3. **Regression Testing:**
   - Verify My Jetpack still loads correctly without the parameter
   - Verify normal Jetpack dashboard access still works
   - Check that menu behavior is correct in various scenarios
