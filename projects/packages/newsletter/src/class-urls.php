<?php
/**
 * URL helper for newsletter settings.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

use Automattic\Jetpack\Status\Host;

/**
 * A class responsible for generating newsletter settings URLs.
 */
class Urls {

	/**
	 * Get the appropriate newsletter settings URL based on context.
	 *
	 * Logic:
	 * - If jetpack_wp_admin_newsletter_settings_enabled filter is true → new settings URL
	 * - Simple sites → Calypso
	 * - WoA with $force_calypso_fallback → Calypso (for Personal/Premium plans)
	 * - WoA with wp-admin interface preference → old Jetpack settings
	 * - WoA with Calypso interface preference → Calypso
	 * - Self-hosted Jetpack → old Jetpack settings
	 *
	 * @param string|null $site_slug              The site slug for Calypso URLs (e.g., 'example.com').
	 * @param bool        $force_calypso_fallback Force Calypso URL as fallback (e.g., for Personal/Premium Atomic).
	 * @return string The newsletter settings URL.
	 */
	public static function get_newsletter_settings_url( $site_slug = null, $force_calypso_fallback = false ) {
		/**
		 * Enables the new in-development newsletter settings UI in wp-admin.
		 *
		 * @since 0.1.0
		 *
		 * @param bool $enabled Whether the new settings UI is enabled. Default false.
		 */
		if ( apply_filters( 'jetpack_wp_admin_newsletter_settings_enabled', false ) ) {
			return admin_url( 'admin.php?page=jetpack-newsletter' );
		}

		$host = new Host();

		// Simple sites always use Calypso.
		if ( $host->is_wpcom_simple() ) {
			return 'https://wordpress.com/settings/newsletter/' . $site_slug;
		}

		// Force Calypso fallback (e.g., for Personal/Premium Atomic).
		if ( $force_calypso_fallback ) {
			return 'https://wordpress.com/settings/newsletter/' . $site_slug;
		}

		// WoA: check interface preference.
		if ( $host->is_woa_site() ) {
			if ( get_option( 'wpcom_admin_interface' ) === 'wp-admin' ) {
				return admin_url( 'admin.php?page=jetpack#/newsletter' );
			}
			return 'https://wordpress.com/settings/newsletter/' . $site_slug;
		}

		// Self-hosted Jetpack.
		return admin_url( 'admin.php?page=jetpack#/newsletter' );
	}
}
