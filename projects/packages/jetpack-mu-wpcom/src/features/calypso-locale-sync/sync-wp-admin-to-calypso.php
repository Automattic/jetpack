<?php
/**
 * Makes sure Calypso and wp-admin locales are in sync.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Update Calypso locale from wp-admin
 *
 * @param string $locale   Locale code.
 */
function update_calypso_locale( $locale ) {
	Client::wpcom_json_api_request_as_user(
		'/me/locale',
		'2',
		array(
			'method' => 'POST',
		),
		array( 'locale' => $locale ),
		'wpcom'
	);
}

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
		$locale = get_option( 'WPLANG' );
		if ( ! $locale ) {
			$locale = 'en';
		}
	}

	update_calypso_locale( $locale );

	return $meta;
}

/**
 * Sync wp-admin site locale to Calypso when wp-admin user locale has "Site Default" option selected.
 *
 * @param array $old_value    Old value of the option WPLANG.
 * @param array $new_value    New value of the option WPLANG.
 */
function sync_wp_admin_site_locale_with_site_default_to_calypso( $old_value, $new_value ) {
	if ( empty( get_user_option( 'locale' ) ) ) {
		// No user locale means to use the site language (WPLANG) or "en".
		update_calypso_locale( $new_value ? $new_value : 'en' );
	}
}
