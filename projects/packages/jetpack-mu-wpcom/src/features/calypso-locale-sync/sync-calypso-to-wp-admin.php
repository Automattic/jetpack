<?php
/**
 * Makes sure Calypso and wp-admin locales are in sync.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Sync locale updated via Calypso /me/account to wp-admin.
 */
function sync_calypso_locale_to_wp_admin() {
	// If we are on the profile update page.
	if ( isset( $_SERVER['REQUEST_URI'] ) && strpos( sanitize_url( wp_unslash( $_SERVER['REQUEST_URI'] ) ), '/wp-admin/profile.php' ) !== false ) {
		// Check if the 'updated' query parameter is set to '1'
		if ( isset( $_GET['updated'] ) && $_GET['updated'] === '1' ) { // phpcs:disable WordPress.Security.NonceVerification.Recommended
			return;
		}
	}

	// Get user connection
	$connection_manager = new Connection_Manager( 'jetpack' );
	if ( ! $connection_manager->is_user_connected( get_current_user_id() ) ) {
		return;
	}
	// Get user locale
	$user_data = $connection_manager->get_connected_user_data( get_current_user_id() );
	$locale    = get_jetpack_locale( $user_data['user_locale'] );

	// Check for changes
	if ( $locale && $locale !== get_user_option( 'locale' ) ) {
		// Install
		install_locale( $locale );

		// Update user meta
		update_user_option( get_current_user_id(), 'locale', $locale, true );

		// Redirect to the same page to refresh changes.
		if ( isset( $_SERVER['REQUEST_URI'] ) ) {
			wp_safe_redirect( wp_unslash( $_SERVER['REQUEST_URI'] ) );
			exit;
		}
	}
}

if ( function_exists( 'wpcom_is_nav_redesign_enabled' ) && wpcom_is_nav_redesign_enabled() ) {
	// Not for POST requests because this syncing needs to be avoided when the locale is updated via /wp-admin/profile.php
	if ( isset( $_SERVER['REQUEST_METHOD'] ) && $_SERVER['REQUEST_METHOD'] !== 'POST' ) {
		add_filter( 'admin_init', 'sync_calypso_locale_to_wp_admin' );
	}
}

/**
 * Get Jetpack locale name.
 *
 * @param  string $slug Locale slug.
 * @return string Jetpack locale.
 */
function get_jetpack_locale( $slug = '' ) {
	$jetpack_locale = '';

	if ( ! class_exists( 'GP_Locales' ) ) {
		if ( defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) && file_exists( (string) JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
			require_once JETPACK__GLOTPRESS_LOCALES_PATH;
		}
	}

	if ( class_exists( 'GP_Locales' ) ) {
		$jetpack_locale_object = GP_Locales::by_field( 'slug', $slug );
		if ( $jetpack_locale_object instanceof GP_Locale ) {
			$jetpack_locale = $jetpack_locale_object->wp_locale ? $jetpack_locale_object->wp_locale : 'en_US';
		}
	}

	return $jetpack_locale;
}

/**
 * Install locale if not yet available.
 *
 * @param string $locale The new locale slug.
 */
function install_locale( $locale = '' ) {
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
