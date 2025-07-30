<?php
/**
 * Featured Image in Email default setting for WordPress.com sites.
 *
 * @package wpcomsh
 */

/**
 * Set the default value for wpcom_featured_image_in_email.
 * For Atomic sites created after May 2, 2025, default to true.
 *
 * @return bool The conditional default value.
 */
function wpcomsh_featured_image_in_email_default() {
	// For Atomic sites, use WordPress.com site ID as a proxy for site creation date
	$wpcom_site_id = null;

	// Get the WordPress.com site ID from Jetpack options
	$jetpack_options = get_option( 'jetpack_options' );
	if ( is_array( $jetpack_options ) && isset( $jetpack_options['id'] ) ) {
		$wpcom_site_id = (int) $jetpack_options['id'];
	}

	if ( $wpcom_site_id ) {
		// Sites created after May 2, 2025 should have higher site IDs
		// Using threshold of 244,134,246 to target sites created after May 2, 2025
		if ( $wpcom_site_id > 244134246 ) {
			return true;
		}
	}

	// Fallback: return false for older sites or if we can't determine
	return false;
}

// Hook to default_option_* filter for when option doesn't exist
add_filter( 'default_option_wpcom_featured_image_in_email', 'wpcomsh_featured_image_in_email_default' );
