<?php
/**
 * AI Launchpad support on WordPress.com Atomic sites.
 *
 * @package wpcomsh
 */

/**
 * Sync the AI Launchpad state, so WordPress.com's copy of the site (e.g. /me/sites) sees changes made here.
 *
 * @param array $options Jetpack Sync allowed options.
 * @return array
 */
function wpcomsh_ai_launchpad_sync_options( $options ) {
	return array_merge(
		$options,
		array(
			'wpcom_ai_launchpad_enabled',
			'wpcom_ai_launchpad_dismissed',
			'wpcom_ai_launchpad_completed',
			'wpcom_ai_launchpad_no_guidance',
		)
	);
}
add_filter( 'jetpack_sync_options_whitelist', 'wpcomsh_ai_launchpad_sync_options' );
