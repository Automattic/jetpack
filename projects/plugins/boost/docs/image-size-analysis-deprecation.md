# Image Size Analysis Deprecation

## Overview

The Image Size Analysis feature is being deprecated. As a first step toward deprecation, a PHP filter has been added to control whether the Image Size Analysis UI is displayed on the main Boost dashboard page.

## Filter

### `jetpack_boost_image_size_analysis_display_ui`

This filter controls whether the Image Size Analysis module UI is displayed on the main Boost dashboard page.

**Default:** `false` (UI is hidden by default)

**Parameters:**
- `$should_display` (bool) - Whether the UI should be displayed

**Returns:** (bool) - Whether the UI should be displayed

## Usage

### Hide the UI (default behavior)
The UI is hidden by default. No action needed.

### Show the UI
To display the Image Size Analysis UI on the main page, add this to your theme's `functions.php` or a custom plugin:

```php
add_filter( 'jetpack_boost_image_size_analysis_display_ui', '__return_true' );
```

### Conditional display
You can also use conditional logic to determine when to show the UI:

```php
add_filter( 'jetpack_boost_image_size_analysis_display_ui', function( $should_display ) {
    // Show UI only for specific user IDs
    if ( get_current_user_id() === 5 ) {
        return true;
    }
    return false;
} );
```

## Behavior

- **When `false` (default):**
  - The Image Size Analysis module is completely hidden from the main Boost dashboard page
  - The "Upgrade to scan your site for issues" message in the Image Guide module is also hidden
- **When `true`:** 
  - The Image Size Analysis module is displayed as before
  - The "Upgrade to scan your site for issues" message in the Image Guide module is displayed as before
- **Subpages:** Direct access to Image Size Analysis subpages (e.g., `/image-size-analysis/`) still works regardless of this filter setting
- **Functionality:** The underlying Image Size Analysis functionality remains intact and accessible via direct URLs

## Migration Path

This filter provides a gradual deprecation path:

1. **Phase 1 (Current):** UI hidden by default, but can be re-enabled via filter
2. **Phase 2 (Future):** Complete removal of the feature

## Notes

- The filter affects both the Image Size Analysis module display and the "Upgrade to scan your site for issues" message in the Image Guide module on the main dashboard page
- All existing functionality remains available for users who access the feature directly
- This change is backward compatible and allows for easy rollback if needed 
