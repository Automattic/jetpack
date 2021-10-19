<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Hotfix to point "Appearances > Widgets" and "Appearances > Menus" links back to the classic wp-admin destination.
 * This hotfix is included in Jetpack 10.3-a.2 and can be removed after that update launches.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Dashboard_Customizations\Atomic_Admin_Menu;

/**
 * Overrides the `Atomic_Admin_Menu` menu class with a hotfix that has not been released yet on Jetpack.
 *
 * @param string $admin_menu_class Class name.
 */
function wpcomsh_use_widget_menus_link_hotfix( $admin_menu_class ) {
	// Do not run if Jetpack is not enabled.
	if ( ! defined( 'JETPACK__VERSION' ) ) {
		return $admin_menu_class;
	}


	// Do not clash with fixes already shipped.
	if ( version_compare( JETPACK__VERSION, '10.3-a.2', '>=' ) ) {
		return $admin_menu_class;
	}

	/**
	 * Extend Atomic_Admin_Menu class to override add_appearance_menu() method.
	 */
	class Atomic_Hotfix_Admin_Menu extends Atomic_Admin_Menu {
		/**
		 * Override the add_appearance_menu() method to undo the changes to the widgets and nav_menus links.
		 *
		 * @return string The Customizer URL.
		 */
		public function add_appearance_menu() {
			// Run the parent method first.
			$customize_url = parent::add_appearance_menu();

			// Undo the changes to widget and nav-menu made by the parent method.
			$submenus_to_update = array(
				add_query_arg( array( 'autofocus' => array( 'panel' => 'widgets' ) ), $customize_url )   => 'widgets.php',
				add_query_arg( array( 'autofocus' => array( 'panel' => 'nav_menus' ) ), $customize_url ) => 'nav-menus.php',
			);
			$this->update_submenus( 'themes.php', $submenus_to_update );

			// Pass through the return string from the parent method.
			return $customize_url;
		}
	}

	return Atomic_Hotfix_Admin_Menu::class;
}

add_action( 'jetpack_admin_menu_class', 'wpcomsh_use_widget_menus_link_hotfix' );
