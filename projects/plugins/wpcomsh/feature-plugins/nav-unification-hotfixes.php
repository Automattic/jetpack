<?php
/**
 * Hotfixes for Nav Unification feature, due to Jetpack monthly release cycle.
 * Each hotfix should declare when it is safe to be removed.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu;

/**
 * Overrides the `Atomic_Admin_Menu` menu class with hotfixes that have not been released yet on Jetpack.
 *
 * @param string $admin_menu_class Class name.
 */
function wpcomsh_use_nav_unification_hotfixes( $admin_menu_class ) {
	// Do not run if Jetpack is not enabled.
	if ( ! defined( 'JETPACK__VERSION' ) ) {
		return $admin_menu_class;
	}

	// Do not clash with fixes already shipped.
	if ( version_compare( JETPACK__VERSION, '9.9-alpha', '>=' ) ) {
		return $admin_menu_class;
	}

	require_once JETPACK__PLUGIN_DIR . 'modules/masterbar/admin-menu/class-atomic-admin-menu.php';

	class Atomic_Hotfixes_Admin_Menu extends Atomic_Admin_Menu {
		/**
		 * Adds Settings menu.
		 *
		 * Hotfix of https://github.com/Automattic/jetpack/pull/20100.
		 *
		 * @param bool $wp_admin Optional. Whether links should point to Calypso or wp-admin. Default false (Calypso).
		 */
		public function add_options_menu( $wp_admin = false ) {
			$this->hide_submenu_page( 'options-general.php', 'sharing' );

			$this->update_submenus( 'options-general.php', array( 'options-general.php' => 'https://wordpress.com/settings/general/' . $this->domain ) );
			add_submenu_page( 'options-general.php', esc_attr__( 'Advanced General', 'jetpack' ), __( 'Advanced General', 'jetpack' ), 'manage_options', 'options-general.php', null, 1 );

			add_submenu_page( 'options-general.php', esc_attr__( 'Performance', 'jetpack' ), __( 'Performance', 'jetpack' ), 'manage_options', 'https://wordpress.com/settings/performance/' . $this->domain, null, 2 );

			if ( ! $wp_admin ) {
				$submenus_to_update = array(
					'options-writing.php'    => 'https://wordpress.com/settings/writing/' . $this->domain,
					'options-discussion.php' => 'https://wordpress.com/settings/discussion/' . $this->domain,
				);
				$this->update_submenus( 'options-general.php', $submenus_to_update );
			}

			add_submenu_page( 'options-general.php', esc_attr__( 'Security', 'jetpack' ), __( 'Security', 'jetpack' ), 'manage_options', 'https://wordpress.com/settings/security/' . $this->domain, null, 2 );
			add_submenu_page( 'options-general.php', esc_attr__( 'Hosting Configuration', 'jetpack' ), __( 'Hosting Configuration', 'jetpack' ), 'manage_options', 'https://wordpress.com/hosting-config/' . $this->domain, null, 11 );
			add_submenu_page( 'options-general.php', esc_attr__( 'Jetpack', 'jetpack' ), __( 'Jetpack', 'jetpack' ), 'manage_options', 'https://wordpress.com/settings/jetpack/' . $this->domain, 12 );

			// Page Optimize is active by default on all Atomic sites and registers a Settings > Performance submenu which
			// would conflict with our own Settings > Performance that links to Calypso, so we hide it it since the Calypso
			// performance settings already have a link to Page Optimize settings page.
			$this->hide_submenu_page( 'options-general.php', 'page-optimize' );

			// No need to add a menu linking to WP Admin if there is already one.
			if ( ! $wp_admin ) {
				add_submenu_page( 'options-general.php', esc_attr__( 'Advanced Writing', 'jetpack' ), __( 'Advanced Writing', 'jetpack' ), 'manage_options', 'options-writing.php' );
			}
		}
	}

	return Atomic_Hotfixes_Admin_Menu::class;
}



add_action( 'jetpack_admin_menu_class', 'wpcomsh_use_nav_unification_hotfixes' );
