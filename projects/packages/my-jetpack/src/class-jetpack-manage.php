<?php
/**
 * Tools to manage things related to "Jetpack Manage"
 * - Add Jetpack Manage menu item.
 * - Check if user is an agency (used by the Jetpack Manage banner)
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Redirect;

/**
 * Jetpack Manage features in My Jetpack.
 */
class Jetpack_Manage {
	/**
	 * Initialize the class and hooks needed.
	 */
	public static function init() {
		add_action( 'admin_menu', array( self::class, 'add_submenu_jetpack' ) );
	}

	/**
	 * The page to be added to submenu
	 *
	 * @return void|null|string The resulting page's hook_suffix
	 */
	public static function add_submenu_jetpack() {
		// Do not display the menu if the user has < 2 sites.
		if ( ! self::could_use_jp_manage( 2 ) ) {
			return;
		}

		$args = array();

		$blog_id = Connection_Manager::get_site_id( true );
		if ( $blog_id ) {
			$args = array( 'site' => $blog_id );
		}

		return Admin_Menu::add_menu(
			__( 'Jetpack Manage', 'jetpack-my-jetpack' ),
			_x( 'Jetpack Manage', 'product name shown in menu', 'jetpack-my-jetpack' ) . ' <span class="dashicons dashicons-external"></span>',
			'manage_options',
			esc_url( Redirect::get_url( 'cloud-manage-dashboard-wp-menu', $args ) ),
			null,
			15
		);
	}

	/**
	 * Check if the user has enough sites to be able to use Jetpack Manage.
	 *
	 * @param int $min_sites Minimum number of sites to be able to use Jetpack Manage.
	 *
	 * @return bool Return true if the user has enough sites to be able to use Jetpack Manage.
	 */
	public static function could_use_jp_manage( $min_sites = 2 ) {
		// Only proceed if the user is connected to WordPress.com.
		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return false;
		}

		// Do not display the menu if Jetpack plugin is not installed.
		if ( ! class_exists( 'Jetpack' ) ) {
			return false;
		}

		// Do not display the menu on Multisite.
		if ( is_multisite() ) {
			return false;
		}

		// Check if the user has the minimum number of sites.
		$user_data = ( new Connection_Manager() )->get_connected_user_data( get_current_user_id() );
		if ( ! isset( $user_data['site_count'] ) || $user_data['site_count'] < $min_sites ) {
			return false;
		}

		return true;
	}

	/**
	 * Check if the user is a partner/agency.
	 *
	 * @return bool Return true if the user is a partner/agency, otherwise false.
	 */
	public static function is_agency_account() {
		// Only proceed if the user is connected to WordPress.com.
		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return false;
		}

		// Get the cached partner data.
		$partner = get_transient( 'jetpack_partner_data' );

		if ( $partner === false ) {
			$wpcom_response = Client::wpcom_json_api_request_as_user( '/jetpack-partners' );

			if ( 200 !== wp_remote_retrieve_response_code( $wpcom_response ) || is_wp_error( $wpcom_response ) ) {
				return false;
			}

			$partner_data = json_decode( wp_remote_retrieve_body( $wpcom_response ) );

			// The jetpack-partners endpoint will return only one partner data into an array, it uses Jetpack_Partner::find_by_owner.
			if ( ! is_array( $partner_data ) || count( $partner_data ) !== 1 || ! is_object( $partner_data[0] ) ) {
				return false;
			}

			$partner = $partner_data[0];

			// Cache the partner data for 1 hour.
			set_transient( 'jetpack_partner_data', $partner, HOUR_IN_SECONDS );
		}

		return $partner->partner_type === 'agency';
	}
}
