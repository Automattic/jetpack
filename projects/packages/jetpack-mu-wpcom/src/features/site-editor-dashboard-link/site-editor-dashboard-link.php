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
		if ( ! empty( $_GET['wp_theme_preview'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			// Point the `<` link to the theme showcase when previewing a theme.
			$settings['__experimentalDashboardLink'] = wpcom_get_calypso_origin() . '/themes/' . wpcom_get_site_slug();
		} else {
			// Point the `<` link to wpcom home.
			$settings['__experimentalDashboardLink'] = wpcom_get_calypso_origin() . '/home/' . wpcom_get_site_slug();
		}
		return $settings;
	}
);
