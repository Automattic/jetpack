<?php
/**
 * Admin Menu loader.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

/**
 * Checks whether the navigation customizations should be performed for the given class.
 *
 * @param string $admin_menu_class Class name.
 * @return bool
 */
function should_customize_nav( $admin_menu_class ) {
	// Make sure the class extends the base admin menu class.
	if ( ! is_subclass_of( $admin_menu_class, Base_Admin_Menu::class ) ) {
		return false;
	}

	$is_api_request = defined( 'REST_REQUEST' ) && REST_REQUEST || 0 === strpos( $_SERVER['REQUEST_URI'], '/?rest_route=%2Fwpcom%2Fv2%2Fadmin-menu' );

	// No nav customizations on WP Admin of Atomic sites when SSO is disabled.
	if ( Atomic_Admin_Menu::class === $admin_menu_class && ! $is_api_request && ! \Jetpack::is_module_active( 'sso' ) ) {
		return false;
	}

	// No nav customizations on WP Admin of Jetpack sites.
	if ( Jetpack_Admin_Menu::class === $admin_menu_class && ! $is_api_request ) {
		return false;
	}

	return true;
}

/**
 * Gets the name of the class that customizes the admin menu.
 *
 * @return string Class name.
 */
function get_admin_menu_class() {
	// WordPress.com Atomic sites.
	if ( jetpack_is_atomic_site() ) {
		require_once __DIR__ . '/class-atomic-admin-menu.php';
		return Atomic_Admin_Menu::class;
	}

	// WordPress.com Simple sites.
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$blog_id = get_current_blog_id();

		// Domain-only sites.
		$blog_options   = get_blog_option( $blog_id, 'options' );
		$is_domain_only = ! empty( $blog_options['is_domain_only'] );
		if ( $is_domain_only ) {
			require_once __DIR__ . '/class-domain-only-admin-menu.php';
			return Domain_Only_Admin_Menu::class;
		}

		// P2 sites.
		require_once WP_CONTENT_DIR . '/lib/wpforteams/functions.php';
		if ( \WPForTeams\is_wpforteams_site( $blog_id ) ) {
			require_once __DIR__ . '/class-p2-admin-menu.php';
			return P2_Admin_Menu::class;
		}

		// Rest of simple sites.
		require_once __DIR__ . '/class-wpcom-admin-menu.php';
		return WPcom_Admin_Menu::class;
	}

	// Jetpack sites.
	require_once __DIR__ . '/class-jetpack-admin-menu.php';
	return Jetpack_Admin_Menu::class;
}

/**
 * Filters the name of the class that customizes the admin menu. It should extends the `Base_Admin_Menu` class.
 *
 * @module masterbar
 *
 * @since 9.6.0
 *
 * @param string $admin_menu_class Class name.
 */
$admin_menu_class = apply_filters( 'jetpack_admin_menu_class', get_admin_menu_class() );
if ( should_customize_nav( $admin_menu_class ) ) {
	$admin_menu_class::get_instance();
}
