<?php
/**
 * Test stub for an admin-ui Admin_Menu that predates the resolver and the named constants.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\Admin_UI;

/**
 * Admin_Menu as admin-ui 0.9.10 (bundled in Jetpack Beta 4.3.0) exposes it to My Jetpack.
 */
class Admin_Menu {

	/**
	 * Positions passed to add_menu(), keyed by menu slug.
	 *
	 * @var array
	 */
	public static $positions = array();

	/**
	 * Records the position an item registered at.
	 *
	 * @param string   $page_title The page title.
	 * @param string   $menu_title The menu title.
	 * @param string   $capability The required capability.
	 * @param string   $menu_slug  The menu slug.
	 * @param callable $function   The page callback.
	 * @param int      $position   The menu position.
	 * @return string The page hook suffix.
	 */
	public static function add_menu( $page_title, $menu_title, $capability, $menu_slug, $function, $position = null ) {
		self::$positions[ $menu_slug ] = $position;

		return 'jetpack_page_' . $menu_slug;
	}
}
