<?php
/**
 * Sync Calypso locale when wp-admin locale is updated via /wp-admin/profile.php.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Client;

if ( function_exists( 'wpcom_is_nav_redesign_enabled' ) && wpcom_is_nav_redesign_enabled() ) {
	add_filter(
		'profile_update',
		function ( $user_id, $old_user_data, $user_data ) {
			$locale = $user_data['locale'];

			if ( ! $locale ) {
				// No locale means the "Site Default" option which is the Site language (WPLANG).
				$locale = get_option( 'WPLANG', '' );
			}

			Client::wpcom_json_api_request_as_user(
				'/me/language',
				'2',
				array(
					'method' => 'POST',
				),
				array( 'language' => $locale ),
				'wpcom'
			);
		},
		8,
		3
	);
}
