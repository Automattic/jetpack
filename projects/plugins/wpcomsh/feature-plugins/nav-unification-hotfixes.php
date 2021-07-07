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
	if ( version_compare( JETPACK__VERSION, '9.9.1-alpha', '>=' ) ) {
		return $admin_menu_class;
	}

	require_once JETPACK__PLUGIN_DIR . 'modules/masterbar/admin-menu/class-atomic-admin-menu.php';

	class Atomic_Hotfixes_Admin_Menu extends Atomic_Admin_Menu {
		/**
		 * Adds Settings menu.
		 *
		 * Hotfix of https://github.com/Automattic/jetpack/pull/20270.
		 */
		public function add_options_menu() {
			parent::add_options_menu();
			add_submenu_page( 'options-general.php', esc_attr__( 'Performance', 'jetpack' ), __( 'Performance', 'jetpack' ), 'manage_options', 'https://wordpress.com/settings/performance/' . $this->domain, null, 2 );
		}
	}

	return Atomic_Hotfixes_Admin_Menu::class;
}



add_action( 'jetpack_admin_menu_class', 'wpcomsh_use_nav_unification_hotfixes' );
