<?php
/**
 * Jetpack forms dashboard view switch.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

use Automattic\Jetpack\Forms\Jetpack_Forms;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Understands switching between classic and redesigned versions of the feedback admin area.
 *
 * @deprecated 6.6.0 This class is no longer needed and has been removed from active use.
 */
class Dashboard_View_Switch {

	/**
	 * Returns true if the current screen is the Jetpack Forms admin page.
	 *
	 * @deprecated 6.6.0 Use Dashboard::is_jetpack_forms_admin_page() instead.
	 *
	 * @return boolean
	 */
	public function is_jetpack_forms_admin_page() {
		_deprecated_function( __METHOD__, 'jetpack-6.6.0', 'Dashboard::is_jetpack_forms_admin_page' );

		if ( ! function_exists( 'get_current_screen' ) ) {
			return false;
		}

		$screen = get_current_screen();
		return $screen && $screen->id === 'jetpack_page_jetpack-forms-admin';
	}

	/**
	 * Returns url of forms admin page.
	 *
	 * @deprecated 6.6.0 Use Dashboard::get_forms_admin_url() instead.
	 *
	 * @param string|null $tab Tab to open in the forms admin page.
	 *
	 * @return string
	 */
	public function get_forms_admin_url( $tab = null ) {
		_deprecated_function( __METHOD__, 'jetpack-6.6.0', 'Dashboard::get_forms_admin_url' );
		$base_url = get_admin_url() . 'admin.php?page=jetpack-forms-admin';

		return self::append_tab_to_url( $base_url, $tab );
	}

	/**
	 * Appends the appropriate tab parameter to the URL based on the view type.
	 *
	 * @param string $url              Base URL to append to.
	 * @param string $tab              Tab to open.
	 *
	 * @return string
	 */
	private static function append_tab_to_url( $url, $tab ) {
		if ( ! $tab ) {
			return $url;
		}

		$status_map = array(
			'spam'  => 'spam',
			'inbox' => 'inbox',
			'trash' => 'trash',
		);

		if ( ! isset( $status_map[ $tab ] ) ) {
			return $url;
		}

		return $url . '#/responses?status=' . $status_map[ $tab ];
	}

	/**
	 * Returns true if the new Jetpack Forms admin page is available.
	 *
	 * @deprecated 6.6.0 Use Dashboard::is_jetpack_forms_admin_page_available() instead.
	 *
	 * @return boolean
	 */
	public static function is_jetpack_forms_admin_page_available() {
		_deprecated_function( __METHOD__, 'jetpack-6.6.0', 'Dashboard::is_jetpack_forms_admin_page_available' );
		return apply_filters( 'jetpack_forms_use_new_menu_parent', true );
	}

	/**
	 * Returns true if the view switch is available.
	 *
	 * @return boolean
	 */
	public static function is_jetpack_forms_view_switch_available() {
		return ! apply_filters( 'jetpack_forms_retire_view_switch', true );
	}

	/**
	 * Returns true if the new Jetpack Forms admin page is announcing the new menu.
	 *
	 * @return boolean
	 */
	public static function is_jetpack_forms_announcing_new_menu() {
		return apply_filters( 'jetpack_forms_announce_new_menu', true );
	}

	/**
	 * Returns true if the classic view is available.
	 *
	 * @return boolean
	 */
	public static function is_classic_view_available() {
		return ! Jetpack_Forms::is_legacy_menu_item_retired();
	}
}
