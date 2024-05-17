<?php
/**
 * Change the Site Editor's dashboard link.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * This file provide a feature to override the Site Editor's dashboard link.
 *
 * @package automattic/jetpack-mu-wpcom
 */

require_once __DIR__ . '/../../utils.php';

add_filter(
	'block_editor_settings_all',
	function ( $settings ) {
		$calypso_origin       = wpcom_get_calypso_origin();
		$wpcom_dashboard_link = esc_url_raw( wp_unslash( $_GET['wpcom_dashboard_link'] ?? '' ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		// Point the `<` link to the `wpcom_dashboard_link` if the relative path is provided.
		if ( ! empty( $wpcom_dashboard_link ) ) {
			$parsed_url = wp_parse_url( $wpcom_dashboard_link );
			if ( ! isset( $parsed_url['host'] ) ) {
				$settings['__experimentalDashboardLink'] = $calypso_origin . $wpcom_dashboard_link;
				return $settings;
			}
		}

		// On sites with Classic view, don't override the dashboard link.
		if ( get_option( 'wpcom_admin_interface' ) === 'wp-admin' ) {
			return $settings;
		}

		if ( ! empty( $_GET['wp_theme_preview'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			// Point the `<` link to the theme showcase when previewing a theme.
			$settings['__experimentalDashboardLink'] = $calypso_origin . '/themes/' . wpcom_get_site_slug();
		} else {
			// Point the `<` link to wpcom home.
			$settings['__experimentalDashboardLink'] = $calypso_origin . '/home/' . wpcom_get_site_slug();
		}
		return $settings;
	}
);
