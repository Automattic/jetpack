<?php
/**
 * WP Admin page with information and configuration shared among all Jetpack stand-alone plugins
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Client as Client;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\Status as Status;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;

/**
 * The main Initializer class that registers the admin menu and eneuque the assets.
 */
class Initializer {

	/**
	 * Initialize My Jetapack
	 *
	 * @return void
	 */
	public static function init() {
		if ( did_action( 'my_jetpack_init' ) ) {
			return;
		}

		// Feature flag while we are developing it.
		if ( ! defined( 'JETPACK_ENABLE_MY_JETPACK' ) || ! JETPACK_ENABLE_MY_JETPACK ) {
			return;
		}

		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		// Add custom WP REST API endoints.
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_endpoints' ) );

		$page_suffix = Admin_Menu::add_menu(
			__( 'My Jetpack', 'jetpack-my-jetpack' ),
			__( 'My Jetpack', 'jetpack-my-jetpack' ),
			'manage_options',
			'my-jetpack',
			array( __CLASS__, 'admin_page' ),
			999
		);

		add_action( 'load-' . $page_suffix, array( __CLASS__, 'admin_init' ) );

		/**
		 * Fires after the My Jetpack package is initialized
		 *
		 * @since $$next_version$$
		 */
		do_action( 'my_jetpack_init' );
	}

	/**
	 * Callback for the load my jetpack page hook.
	 *
	 * @return void
	 */
	public static function admin_init() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_scripts' ) );
	}

	/**
	 * Returns whether we are in condition to track to use
	 * Analytics functionality like Tracks, MC, or GA.
	 */
	public static function can_use_analytics() {
		$status     = new Status();
		$connection = new Connection_Manager();
		$tracking   = new Tracking( 'jetpack', $connection );

		return $tracking->should_enable_tracking( new Terms_Of_Service(), $status );
	}
	/**
	 * Enqueue admin page assets.
	 *
	 * @return void
	 */
	public static function enqueue_scripts() {
		Assets::register_script(
			'my_jetpack_main_app',
			'../build/index.js',
			__FILE__,
			array(
				'enqueue'    => true,
				'in_footer'  => true,
				'textdomain' => 'jetpack-my-jetpack',
			)
		);
		wp_localize_script(
			'my_jetpack_main_app',
			'myJetpackInitialState',
			array(
				'apiRoot'               => esc_url_raw( rest_url() ),
				'apiNonce'              => wp_create_nonce( 'wp_rest' ),
				'products'              => array(
					'items' => Products::get_products(),
				),
				'purchases'             => array(
					'items' => array(),
				),
				'redirectUrl'           => admin_url( '?page=my-jetpack' ),
				'topJetpackMenuItemUrl' => Admin_Menu::get_top_level_menu_item_url(),
				'siteSuffix'            => ( new Status() )->get_site_suffix(),
			)
		);

		// Connection Initial State.
		wp_add_inline_script( 'my_jetpack_main_app', Connection_Initial_State::render(), 'before' );

		// Required for Analytics.
		if ( self::can_use_analytics() ) {
			Tracking::register_tracks_functions_scripts( true );
		}
	}

	/**
	 * Echoes the admin page content.
	 *
	 * @return void
	 */
	public static function admin_page() {
		echo '<div id="my-jetpack-container"></div>';
	}

	/**
	 * Register the REST API routes.
	 *
	 * @return void
	 */
	public static function register_rest_endpoints() {
		new REST_Products();
		new REST_Purchases();

		register_rest_route(
			'my-jetpack/v1',
			'site',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);
	}

	/**
	 * Check user capability to access the endpoint.
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
	 * Site full-data endpoint.
	 *
	 * @return object Site data.
	 */
	public static function get_site() {
		$site_id           = \Jetpack_Options::get_option( 'id' );
		$wpcom_endpoint    = sprintf( '/sites/%d?force=wpcom', $site_id );
		$wpcom_api_version = '1.1';
		$response          = Client::wpcom_json_api_request_as_blog( $wpcom_endpoint, $wpcom_api_version );
		$response_code     = wp_remote_retrieve_response_code( $response );
		$body              = json_decode( wp_remote_retrieve_body( $response ) );

		if ( is_wp_error( $response ) || empty( $response['body'] ) ) {
			return new \WP_Error( 'site_data_fetch_failed', 'Site data fetch failed', array( 'status' => $response_code ) );
		}

		return rest_ensure_response( $body, 200 );
	}

}
