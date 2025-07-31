<?php
/**
 * Featured Image in Email default setting for WordPress.com sites.
 *
 * @package wpcomsh
 */

/**
 * Get the site creation timestamp via API request.
 *
 * @return int The site creation date as a Unix timestamp or 0 for default fallback.
 */
function wpcomsh_get_site_creation_timestamp() {
	$default_timestamp = 0;

	// Check if Jetpack is connected
	if ( ! class_exists( 'Jetpack' ) || ! Jetpack::is_connection_ready() ) {
		return $default_timestamp;
	}

	$transient_key             = 'wpcomsh_featured_image_site_creation';
	$cached_creation_timestamp = get_transient( $transient_key );

	if ( false !== $cached_creation_timestamp ) {
		return $cached_creation_timestamp;
	}

	// Make authenticated API request to get site creation date
	$site_id = Automattic\Jetpack\Connection\Manager::get_site_id( true );

	if ( ! $site_id ) {
		return $default_timestamp;
	}

	$response = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog(
		sprintf( '/sites/%d?force=wpcom&options=created_at', $site_id ),
		'1.1'
	);

	if ( is_wp_error( $response ) ) {
		return $default_timestamp;
	}

	$body      = wp_remote_retrieve_body( $response );
	$site_data = json_decode( $body );

	if ( ! $site_data || ! isset( $site_data->options->created_at ) ) {
		return $default_timestamp;
	}

	$site_creation_timestamp = strtotime( $site_data->options->created_at );

	// Cache the result for 24 hours
	set_transient( $transient_key, $site_creation_timestamp, DAY_IN_SECONDS );

	return $site_creation_timestamp;
}

/**
 * Set the default value for wpcom_featured_image_in_email.
 * For Atomic sites created after May 2, 2025, default to true.
 *
 * @return bool The conditional default value.
 */
function wpcomsh_featured_image_in_email_default() {
	$site_creation_timestamp = wpcomsh_get_site_creation_timestamp();

	if ( $site_creation_timestamp ) {
		// Check if site was created after May 2, 2025
		$cutoff_timestamp = strtotime( '2025-05-02' );
		if ( $site_creation_timestamp > $cutoff_timestamp ) {
			return true;
		}
	}

	// Fallback: return false for older sites or if we can't determine
	return false;
}

// Hook to default_option_* filter for when option doesn't exist
add_filter( 'default_option_wpcom_featured_image_in_email', 'wpcomsh_featured_image_in_email_default' );
