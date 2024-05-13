<?php
/**
 * Sync Calypso locale when wp-admin locale is updated via /wp-admin/profile.php.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Client;

if ( function_exists( 'wpcom_is_nav_redesign_enabled' ) && wpcom_is_nav_redesign_enabled() ) {
	add_filter(
		'insert_user_meta',
		function ( $meta, $user, $update ) {
			$locale     = $meta['locale'];
			$old_locale = get_user_locale( $user );

			if ( ! $update || $old_locale === $locale ) {
				// Only for locale changes on an existing user
				return $meta;
			}

			if ( ! $locale ) {
				// No locale means the "Site Default" option which is the Site language (WPLANG).
				$locale = get_option( 'WPLANG', '' );
			}

			Client::wpcom_json_api_request_as_user(
				'/me/locale',
				'2',
				array(
					'method' => 'POST',
				),
				array( 'locale' => $locale ),
				'wpcom'
			);

			return $meta;
		},
		8,
		3
	);
}
