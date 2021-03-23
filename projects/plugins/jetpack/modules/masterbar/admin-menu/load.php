<?php
/**
 * Admin Menu loader.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

/**
 * Gets the name of the class that customizes the admin menu.
 *
 * @return string Class name.
 */
function get_admin_menu_class() {
	// WordPress.com Atomic sites.
	if ( jetpack_is_atomic_site() ) {
		require_once __DIR__ . '/class-atomic-admin-menu.php';
		return __NAMESPACE__ . '\Atomic_Admin_Menu';
	}

	// WordPress.com Simple sites.
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$blog_id = get_current_blog_id();

		// Domain-only sites.
		$blog_options   = get_blog_option( $blog_id, 'options' );
		$is_domain_only = ! empty( $blog_options['is_domain_only'] );
		if ( $is_domain_only ) {
			require_once __DIR__ . '/class-domain-only-admin-menu.php';
			return __NAMESPACE__ . '\Domain_Only_Admin_Menu';
		}

		// P2 sites.
		if ( \WPForTeams\is_wpforteams_site( $blog_id ) ) {
			require_once __DIR__ . '/class-p2-admin-menu.php';
			return __NAMESPACE__ . '\P2_Admin_Menu';
		}

		// Rest of simple sites.
		require_once __DIR__ . '/class-wpcom-admin-menu.php';
		return __NAMESPACE__ . '\WPcom_Admin_Menu';
	}

	// Jetpack sites.
	require_once __DIR__ . '/class-jetpack-admin-menu.php';
	return __NAMESPACE__ . '\Jetpack_Admin_Menu';
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
if ( is_subclass_of( $admin_menu_class, __NAMESPACE__ . '\Base_Admin_Menu' ) ) {
	$admin_menu_class::get_instance();
}
