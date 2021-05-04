<?php
/**
 * A class that adds a search link to the admin sidebar.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Redirect;
use Jetpack_Plan;

/**
 * Class Main
 *
 * Responsible for showing the link if available.
 *
 * @package Automattic\Jetpack\Search
 */
class Admin_Sidebar_Link {
	/**
	 * The singleton instance of this class.
	 *
	 * @var Admin_Sidebar_Link
	 */
	protected static $instance;

	/**
	 * Get the singleton instance of the class.
	 *
	 * @return Admin_Sidebar_Link
	 */
	public static function instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new Admin_Sidebar_Link();
			self::$instance->init_hooks();
		}

		return self::$instance;
	}

	/**
	 * Adds action hooks.
	 */
	public function init_hooks() {
		add_action( 'jetpack_admin_menu', array( $this, 'add_search_admin_link' ), 99 );
	}

	/**
	 * Adds an admin sidebar link pointing to the Search page.
	 */
	public function add_search_admin_link() {
		if ( ! $this->should_show_link() ) {
			return;
		}

		$menu_label = __( 'Search', 'jetpack' );
		add_submenu_page( 'jetpack', $menu_label, esc_html( $menu_label ) . ' <span class="dashicons dashicons-external"></span>', 'manage_options', esc_url( Redirect::get_url( 'calypso-search' ) ), null, $this->get_link_offset() );
	}

	/**
	 * Create a menu offset by counting all the pages that have a jetpack_admin_page set as the capability.
	 *
	 * This makes it so that the highlight of the pages works as expected. When you click on the Setting or Dashboard.
	 *
	 * @return int Menu offset.
	 */
	private function get_link_offset() {
		global $submenu;
		$offset = 0;
		foreach ( $submenu['jetpack'] as $link ) {
			if ( 'jetpack_admin_page' !== $link[1] ) {
				break;
			}
			$offset++;
		}

		return $offset;
	}

	/**
	 * Determine if the link should appear in the sidebar.
	 *
	 * @return boolean
	 */
	private function should_show_link() {
		// Jetpack Search is currently not supported on multisite.
		if ( is_multisite() ) {
			return false;
		}

		return Jetpack_Plan::supports( 'search' );
	}
}


