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
use WP_Error;
use WP_Rest_Response;

/**
 * Jetpack Manage features in My Jetpack.
 */
class Jetpack_Manage {
	/**
	 * Transient holding the partner type this site's owner has, as answered by WordPress.com.
	 *
	 * @var string
	 */
	const PARTNER_TYPE_TRANSIENT_KEY = 'jetpack_partner_type';

	/**
	 * Cached partner type when the lookup found that this site's owner has no partner account.
	 *
	 * `get_transient()` returns `false` for a miss, so "no partner" needs a value of its own to be
	 * distinguishable from "not looked up yet".
	 *
	 * @var string
	 */
	private const NO_PARTNER = 'none';

	/**
	 * Initialize the class and hooks needed.
	 */
	public static function init() {
		add_action( 'admin_menu', array( self::class, 'add_submenu_jetpack' ) );
	}

	/**
	 * Register the REST API routes.
	 *
	 * @return void
	 */
	public static function register_rest_endpoints() {
		register_rest_route(
			'my-jetpack/v1',
			'jetpack-manage/data',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_jetpack_manage_data',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);

		register_rest_route(
			'my-jetpack/v1',
			'jetpack-manage/dismiss-banner',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::dismiss_banner',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);
	}

	/**
	 * Check user capabilities to access historically active modules.
	 *
	 * @access public
	 * @static
	 *
	 * @return true|WP_Error
	 */
	public static function permissions_callback() {
		return current_user_can( 'manage_options' );
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
			_x( 'Jetpack Manage', 'product name shown in menu', 'jetpack-my-jetpack' ) . ' <span aria-hidden="true">↗</span>',
			'manage_options',
			esc_url( Redirect::get_url( 'cloud-manage-dashboard-wp-menu', $args ) ),
			null,
			16
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

		// Get the cached partner type.
		$partner_type = get_transient( self::PARTNER_TYPE_TRANSIENT_KEY );

		if ( false === $partner_type ) {
			$wpcom_response = Client::wpcom_json_api_request_as_user( '/jetpack-partners' );
			$response_code  = (int) wp_remote_retrieve_response_code( $wpcom_response );

			// A network failure or a server-side error is not an answer about this site, so leave
			// the cache empty and ask again next time.
			if ( is_wp_error( $wpcom_response ) || 0 === $response_code || $response_code >= 500 ) {
				return false;
			}

			$partner_data = 200 === $response_code
				? json_decode( wp_remote_retrieve_body( $wpcom_response ) )
				: null;

			// The endpoint returns a single-element array (it uses Jetpack_Partner::find_by_owner),
			// and answers 403 for a user with no partner account — which is most of them. "No
			// partner" is a real answer and gets cached like any other; without that, those sites
			// repeat this request on every page load that asks.
			$partner_type = is_array( $partner_data ) && count( $partner_data ) === 1 && isset( $partner_data[0]->partner_type )
				? $partner_data[0]->partner_type
				: self::NO_PARTNER;

			// Cache the partner type for 1 hour.
			set_transient( self::PARTNER_TYPE_TRANSIENT_KEY, $partner_type, HOUR_IN_SECONDS );
		}

		return 'agency' === $partner_type;
	}

	/**
	 * Check whether the Automattic for Agencies banner has been dismissed on this site.
	 *
	 * The dismissal is stored per site rather than per user: whether the people running this site
	 * want an agency partnership is a property of the site, not of an individual login, so one
	 * admin dismissing the banner settles it for everyone.
	 *
	 * The trade-off is worth stating, because the rest of this payload does not work that way.
	 * `could_use_jp_manage()` and `is_agency_account()` are both computed from the *current*
	 * admin's WordPress.com account, so a second admin who would have been shown the banner
	 * cannot bring it back once someone else has dismissed it.
	 *
	 * @return bool True if the banner has been dismissed.
	 */
	public static function is_banner_dismissed() {
		return (bool) \Jetpack_Options::get_option( 'dismissed_a4a_banner', false );
	}

	/**
	 * Dismiss the Automattic for Agencies banner.
	 *
	 * @return WP_REST_Response
	 */
	public static function dismiss_banner() {
		\Jetpack_Options::update_option( 'dismissed_a4a_banner', true );

		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * Get Jetpack Manage data for REST API.
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public static function get_jetpack_manage_data() {
		$is_enabled        = self::could_use_jp_manage();
		$is_agency_account = self::is_agency_account();

		return rest_ensure_response(
			array(
				'isEnabled'       => $is_enabled,
				'isAgencyAccount' => $is_agency_account,
				'isDismissed'     => self::is_banner_dismissed(),
			)
		);
	}
}
