<?php
/**
 * First posts stream helpers
 *
 * @package automattic/jetpack-mu-wpcom
 * @since 4.11.0
 */

/**
 * Adds the required options to the sync list for the First Posts Stream feature.
 *
 * @param array $allowed_options The allowed options.
 */
function register_first_posts_stream_options_sync( $allowed_options ) {
	// We are not either in Simple or Atomic.
	if ( ! class_exists( 'Automattic\Jetpack\Status\Host' ) ) {
		return $allowed_options;
	}

	if ( ! ( new Automattic\Jetpack\Status\Host() )->is_woa_site() ) {
		return $allowed_options;
	}

	if ( ! is_array( $allowed_options ) ) {
		return $allowed_options;
	}

	$launchpad_options = array(
		'wpcom_has_first_post',
	);

	return array_merge( $allowed_options, $launchpad_options );
}

add_filter( 'jetpack_sync_options_whitelist', 'register_first_posts_stream_options_sync', 10, 1 );
