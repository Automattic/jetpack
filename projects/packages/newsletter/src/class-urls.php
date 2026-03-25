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
	 * - WoA Personal/Premium plans → Calypso (Jetpack Settings page is hidden)
	 * - WoA with wp-admin interface preference → old Jetpack settings
	 * - WoA with Calypso interface preference → Calypso
	 * - Self-hosted Jetpack → old Jetpack settings
	 *
	 * @param string|null $site_slug            The site slug for Calypso URLs (e.g., 'example.com').
	 * @param bool        $relative_calypso_path Return relative path for Calypso URLs (e.g., '/settings/newsletter/...').
	 * @return string The newsletter settings URL.
	 */
	public static function get_newsletter_settings_url( $site_slug = null, $relative_calypso_path = false ) {
		/**
		 * Enables the new in-development newsletter settings UI in wp-admin.
		 *
		 * @since 0.6.0
		 *
		 * @param bool $enabled Whether the new settings UI is enabled. Default true.
		 */
		if ( apply_filters( 'jetpack_wp_admin_newsletter_settings_enabled', true ) ) {
			return admin_url( 'admin.php?page=jetpack-newsletter' );
		}

		$host         = new Host();
		$calypso_path = '/settings/newsletter/' . $site_slug;

		// Simple sites always use Calypso.
		if ( $host->is_wpcom_simple() ) {
			return $relative_calypso_path ? $calypso_path : 'https://wordpress.com' . $calypso_path;
		}

		// WoA sites.
		if ( $host->is_woa_site() ) {
			// On Personal/Premium Atomic, the Jetpack Settings page is hidden,
			// so always use Calypso.
			if ( self::is_personal_or_premium_plan() ) {
				return $relative_calypso_path ? $calypso_path : 'https://wordpress.com' . $calypso_path;
			}

			if ( get_option( 'wpcom_admin_interface' ) === 'wp-admin' ) {
				return admin_url( 'admin.php?page=jetpack#/newsletter' );
			}
			return $relative_calypso_path ? $calypso_path : 'https://wordpress.com' . $calypso_path;
		}

		// Self-hosted Jetpack.
		return admin_url( 'admin.php?page=jetpack#/newsletter' );
	}

	/**
	 * Check if the current site is on a Personal or Premium plan.
	 *
	 * @return bool
	 */
	private static function is_personal_or_premium_plan() {
		$current_plan = \Automattic\Jetpack\Current_Plan::get();
		$plan_class   = $current_plan['class'] ?? '';
		return in_array( $plan_class, array( 'personal', 'premium' ), true );
	}
}
