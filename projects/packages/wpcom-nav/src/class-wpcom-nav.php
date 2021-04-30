<?php
/**
 * Provides a customized navigation suited for WordPress.com
 *
 * @package automattic/jetpack-wpcom-nav
 */

namespace Automattic\Jetpack;

/**
 * Class Wpcom_Nav
 *
 * @package automattic/jetpack-wpcom-nav
 */
class Wpcom_Nav {

	/**
	 * Gets the name of the class that customizes the admin menu.
	 *
	 * @return string Class name.
	 */
	public function get_admin_menu_class() {
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
			require_once __DIR__ . '/class-simple-admin-menu.php';
			return Simple_Admin_Menu::class;
		}

		// Jetpack sites.
		require_once __DIR__ . '/class-jetpack-admin-menu.php';
		return Jetpack_Admin_Menu::class;
	}

	/**
	 * Replaces the admin menu.
	 */
	public function replace_admin_menu() {
		/**
		 * Filters the name of the class that customizes the admin menu. It should extends the `Base_Admin_Menu` class.
		 *
		 * @module masterbar
		 *
		 * @param string $admin_menu_class Class name.
		 *
		 * @since 9.6.0
		 */
		$admin_menu_class = apply_filters( 'jetpack_admin_menu_class', $this->get_admin_menu_class() );
		if ( is_subclass_of( $admin_menu_class, Base_Admin_Menu::class ) ) {
			$admin_menu_class::get_instance();
		}
	}
}
