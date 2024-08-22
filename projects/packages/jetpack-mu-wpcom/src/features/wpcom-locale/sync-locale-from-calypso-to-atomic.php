<?php
/**
 * Sync locale from Calypso to Atomic sites.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Get Jetpack locale name.
 *
 * @param  string $slug Locale slug.
 * @return string Jetpack locale.
 */
function _get_jetpack_locale( $slug = '' ) {
	if ( ! class_exists( 'GP_Locales' ) ) {
		if ( defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) && file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
			require JETPACK__GLOTPRESS_LOCALES_PATH;
		}
	}

	if ( class_exists( 'GP_Locales' ) ) {
		$jetpack_locale_object = GP_Locales::by_field( 'slug', $slug );
		if ( $jetpack_locale_object instanceof GP_Locale ) {
			$jetpack_locale = $jetpack_locale_object->wp_locale ? $jetpack_locale_object->wp_locale : 'en_US';
		}
	}

	if ( isset( $jetpack_locale ) ) {
		return $jetpack_locale;
	}

	return 'en_US';
}

/**
 * Install locale if not yet available.
 *
 * @param string $locale The new locale slug.
 */
function _install_locale( $locale = '' ) {
	if ( ! in_array( $locale, get_available_languages(), true )
		&& ! empty( $locale ) && current_user_can( 'install_languages' ) ) {

		if ( ! function_exists( 'wp_download_language_pack' ) ) {
			require_once ABSPATH . 'wp-admin/includes/translation-install.php';
		}

		if ( ! function_exists( 'request_filesystem_credentials' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		if ( wp_can_install_language_pack() ) {
			wp_download_language_pack( $locale );
			load_default_textdomain( $locale );
		}
	}
}

/**
 * Trigger reloading of all non-default textdomains if the user just changed
 * their locale on WordPress.com.
 *
 * @param string $wpcom_locale The user's detected WordPress.com locale.
 */
function _unload_non_default_textdomains_on_wpcom_user_locale_switch( $wpcom_locale ) {
	$user_switched_locale = get_user_locale() !== $wpcom_locale;
	if ( ! $user_switched_locale ) {
		return;
	}

	global $l10n;
	$loaded_textdomains      = array_keys( $l10n );
	$non_default_textdomains = array_diff( $loaded_textdomains, array( 'default' ) );
	foreach ( $non_default_textdomains as $textdomain ) {
		// Using $reloadable = true makes sure the correct locale's
		// translations are loaded just-in-time.
		unload_textdomain( $textdomain, true );
	}
}

/**
 * Handles the locale setup for Atomic sites.
 *
 * @param string $user_locale The user's locale.
 */
function wpcom_sync_locale_from_calypso_to_atomic( $user_locale ) {
	$is_atomic_site = ( new Automattic\Jetpack\Status\Host() )->is_woa_site();
	if ( ! $is_atomic_site ) {
		return;
	}

	$user_id            = get_current_user_id();
	$connection_manager = new Connection_Manager( 'jetpack' );
	if ( ! $connection_manager->is_user_connected( $user_id ) ) {
		return;
	}
	$user_data   = $connection_manager->get_connected_user_data( $user_id );
	$user_locale = $user_data['user_locale'] ?? '';

	$jetpack_locale = _get_jetpack_locale( $user_locale );
	_install_locale( $jetpack_locale );
	_unload_non_default_textdomains_on_wpcom_user_locale_switch( $jetpack_locale );

	if ( get_user_option( 'locale', $user_id ) !== $jetpack_locale ) {
		update_user_option( $user_id, 'locale', $jetpack_locale, true );
	}
}
add_filter( 'init', 'wpcom_sync_locale_from_calypso_to_atomic' );
