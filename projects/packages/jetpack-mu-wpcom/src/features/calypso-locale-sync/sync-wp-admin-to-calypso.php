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
	if ( empty( $locale ) ) {
		return;
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
}

/**
 * Sync locale updated via /wp-admin/profile.php to Calypso.
 */
function sync_wp_admin_locale_on_profile_update() {
	static $is_updating_calypso_locale = false;

	// Bail if we started updating the locale earlier in the current request.
	if ( $is_updating_calypso_locale ) {
		return;
	}

	// To further prevent a potential unexpected amplification of the underlying async jobs,
	// we only trigger the sync from either admin pages or API requests.
	if ( ! is_admin() && ( ! defined( 'REST_REQUEST' ) || ! REST_REQUEST ) ) {
		return;
	}

	$locale = null;

	if ( isset( $_POST['locale'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$locale = sanitize_text_field( wp_unslash( $_POST['locale'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
	}

	if ( '' === $locale ) {
		$locale = 'en';
	}

	$user_id = get_current_user_id();

	if ( ! $user_id || empty( $locale ) ) {
		return;
	}

	$user               = get_userdata( $user_id );
	$old_locale         = get_user_locale( $user );
	$connection_manager = new Connection_Manager( 'jetpack' );
	$is_user_connected  = $connection_manager->is_user_connected();

	if ( $old_locale === $locale || ! $is_user_connected ) {
		// Only proceed for locale changes on an existing connected WPCOM user.
		return;
	}

	if ( 'site-default' === $locale ) {
		// Use the Site language (WPLANG) or "en" for 'site-default'.
		$locale_option = get_option( 'WPLANG', 'en' );
		// WPLANG can be an empty string, so we still need to check if it's empty.
		$locale = ! empty( $locale_option ) ? $locale_option : 'en';
	}

	$is_updating_calypso_locale = true;

	update_calypso_locale( $locale );
}

/**
 * Sync wp-admin site locale to Calypso when wp-admin user locale has "Site Default" option selected.
 *
 * @param array $old_value    Old value of the option WPLANG.
 * @param array $new_value    New value of the option WPLANG.
 */
function sync_wp_admin_site_locale_with_site_default_to_calypso( $old_value, $new_value ) {
	if ( empty( get_user_option( 'locale' ) ) ) {
		// Empty user locale means site-default and uses the site language (WPLANG) or "en" when WPLANG is empty.
		update_calypso_locale( $new_value ? $new_value : 'en' );
	}
}

if ( function_exists( 'wpcom_is_nav_redesign_enabled' ) && wpcom_is_nav_redesign_enabled() ) {
	add_action( 'personal_options_update', 'sync_wp_admin_locale_on_profile_update' );
	add_filter( 'update_option_WPLANG', 'sync_wp_admin_site_locale_with_site_default_to_calypso', 10, 2 );
}
