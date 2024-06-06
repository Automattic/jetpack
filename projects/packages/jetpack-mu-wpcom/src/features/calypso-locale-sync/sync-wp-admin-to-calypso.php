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
	$user_id = get_current_user_id();
	// phpcs:ignore WordPress.Security.NonceVerification.Missing
	$locale = isset( $_POST['locale'] ) ? sanitize_text_field( wp_unslash( $_POST['locale'] ) ) : '';
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

	update_calypso_locale( $locale );
}

if ( function_exists( 'wpcom_is_nav_redesign_enabled' ) && wpcom_is_nav_redesign_enabled() ) {
	add_action( 'personal_options_update', 'sync_wp_admin_locale_on_profile_update' );
}
