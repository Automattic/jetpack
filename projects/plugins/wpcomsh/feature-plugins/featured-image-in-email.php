<?php
/**
 * Featured Image in Email default setting for WordPress.com sites.
 *
 * @package wpcomsh
 */

/**
 * Set the default value for wpcom_featured_image_in_email based on site creation date.
 * For WordPress.com sites created after May 2, 2025, default to true.
 *
 * @param mixed $default_value The default value for the option.
 * @return bool The conditional default value.
 */
function wpcomsh_featured_image_in_email_default( $default_value ) {
	// Only apply conditional logic for WordPress.com sites
	if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
		return $default_value;
	}

	global $current_blog;
	if ( ! $current_blog || ! method_exists( $current_blog, 'get_registered_date' ) ) {
		return $default_value;
	}

	$registered_date = $current_blog->get_registered_date();

	// Compare to May 2, 2025 (ISO 8601 format)
	if ( $registered_date && $registered_date !== '0000-00-00T00:00:00+00:00' && strtotime( $registered_date ) >= strtotime( '2025-05-02T00:00:00+00:00' ) ) {
		return true;
	}

	return false;
}

// Hook to both default_option_* and option_* filters to ensure the conditional logic is applied
// when the option doesn't exist yet and when it's being read
add_filter( 'default_option_wpcom_featured_image_in_email', 'wpcomsh_featured_image_in_email_default' );
add_filter( 'option_wpcom_featured_image_in_email', 'wpcomsh_featured_image_in_email_default' );
