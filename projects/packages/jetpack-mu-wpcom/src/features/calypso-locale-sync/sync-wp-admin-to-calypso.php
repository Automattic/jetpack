<?php
/**
 * Makes sure Calypso and wp-admin locales are in sync.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Sync locale updated via /wp-admin/profile.php to Calypso.
 *
 * @param array   $meta   Meta values and keys for the user.
 * @param WP_User $user   User object.
 * @param boolean $update Whether the user is being updated rather than created.
 */
function sync_wp_admin_locale_to_calypso( $meta, $user, $update ) {
	$locale            = $meta['locale'];
	$old_locale        = get_user_locale( $user );
	$is_user_connected = ( new Connection_Manager( 'jetpack' ) )->is_user_connected();

	if ( ! $update || $old_locale === $locale || ! $is_user_connected ) {
		// Only proceed for locale changes on an existing connected WPCOM user.
		return $meta;
	}

	if ( ! $locale ) {
		// No locale means the "Site Default" option, which is the Site language (WPLANG) or "en".
		$locale = get_option( 'WPLANG', 'en' );
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
}

if ( function_exists( 'wpcom_is_nav_redesign_enabled' ) && wpcom_is_nav_redesign_enabled() ) {
	add_filter( 'insert_user_meta', 'sync_wp_admin_locale_to_calypso', 8, 3 );
}
