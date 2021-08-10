<?php
/**
 * Jetpack connection client.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Terms_Of_Service;

/**
 * Class Connection
 *
 * Manages the Jetpack connection on behalf of Jetpack Boost.
 */
class Connection {

	/**
	 * Jetpack Connection Manager.
	 *
	 * @var Manager $manager The connection manager.
	 */
	private $manager;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->manager = new Manager( 'jetpack-boost' );

		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );

		add_filter( 'jetpack_boost_js_constants', array( $this, 'add_connection_config_data' ) );

		$this->initialize_deactivate_disconnect();
	}

	/**
	 * Add connection data to the array of constants
	 *
	 * @param array $constants The associative array of constants.
	 */
	public function add_connection_config_data( $constants ) {
		$constants['connection'] = $this->get_connection_api_response();

		return $constants;
	}

	/**
	 * Initialize the plugin deactivation hook.
	 */
	public function initialize_deactivate_disconnect() {
		require_once ABSPATH . '/wp-admin/includes/plugin.php';

		if ( is_plugin_active_for_network( JETPACK_BOOST_PATH ) ) {
			register_deactivation_hook( JETPACK_BOOST_PATH, array( $this, 'deactivate_disconnect_network' ) );
		} else {
			register_deactivation_hook( JETPACK_BOOST_PATH, array( $this, 'deactivate_disconnect' ) );
		}
	}

	/**
	 * Deactivate the connection on plugin disconnect.
	 */
	public function deactivate_disconnect() {
		$this->manager->disconnect_site_wpcom();
		$this->manager->delete_all_connection_tokens();
	}

	/**
	 * Deactivate the connection on plugin disconnect for network-activated plugins.
	 */
	public function deactivate_disconnect_network() {
		if ( ! is_network_admin() ) {
			return;
		}

		foreach ( get_sites() as $s ) {
			switch_to_blog( $s->blog_id );

			$active_plugins = get_option( 'active_plugins' );

			/*
			 * If this plugin was activated in the subsite individually
			 * we do not want to call disconnect. Plugins activated
			 * individually (before network activation) stay activated
			 * when the network deactivation occurs
			 */
			if ( ! in_array( JETPACK_BOOST_PATH, $active_plugins, true ) ) {
				$this->deactivate_disconnect();
			}

			restore_current_blog();
		}
	}

	/**
	 * Connection Lifecycle methods.
	 */

	/**
	 * Get the WordPress.com blog ID of this site, if it's connected
	 */
	public static function wpcom_blog_id() {
		return defined( 'IS_WPCOM' ) && IS_WPCOM ? get_current_blog_id() : \Jetpack_Options::get_option( 'id' );
	}

	/**
	 * True if the site is connected to WP.com.
	 *
	 * @return boolean
	 */
	public function is_connected() {
		if ( true === apply_filters( 'jetpack_boost_connection_bypass', false ) ) {
			return true;
		}

		// Temporary hack for Jetpack < 9.2 compatibility without notices.
		if ( method_exists( $this->manager, 'is_connected' ) ) {
			$is_connected = $this->manager->is_connected();
		} else {
			$is_connected = $this->manager->is_registered();
		}

		return $is_connected && $this->manager->is_plugin_enabled();
	}

	/**
	 * Register site using connection manager.
	 *
	 * @return true|\WP_Error The error object.
	 */
	public function register() {
		$this->manager->enable_plugin();

		if ( $this->is_connected() ) {
			Analytics::record_user_event( 'connect_site' );

			return true;
		}

		$result = $this->manager->register();

		if ( ! is_wp_error( $result ) ) {
			Analytics::record_user_event( 'connect_site' );
		}

		return $result;
	}

	/**
	 * Disconnect from Jetpack account.
	 *
	 * @return bool
	 */
	public function disconnect() {
		// @todo implement check for Jetpack::validate_sync_error_idc_option() so we don't disconnect production site from staging etc.
		Analytics::record_user_event( 'disconnect_site' );

		$this->manager->remove_connection();

		// @todo: implement clearing of IDC options
		// Jetpack_IDC::clear_all_idc_options();

		// @todo: implement check of updating activated state?
		// if ( $update_activated_state ) {
		// Jetpack_Options::update_option( 'activated', 4 );
		// }

		// @todo: implement check of unique connection increment/decrement
		// if ( $jetpack_unique_connection = Jetpack_Options::get_option( 'unique_connection' ) ) {
		// ...
		// }

		// @todo: Delete all the sync related data. Since it could be taking up space.
		// Sender::get_instance()->uninstall();

		// @todo: Disable the Heartbeat cron
		// Jetpack_Heartbeat::init()->deactivate();
		return true;
	}

	/**
	 * REST endpoint methods.
	 */
	public function register_rest_routes() {
		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/connection',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_connection_endpoint' ),
				'permission_callback' => array( $this, 'can_manage_connection' ),
			)
		);

		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/connection',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'create_connection_endpoint' ),
				'permission_callback' => array( $this, 'can_manage_connection' ),
			)
		);
	}

	/**
	 * Register site using connection manager.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_connection_endpoint( \WP_REST_Request $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		( new Terms_Of_Service() )->agree();

		$response = $this->register();

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return rest_ensure_response( $this->get_connection_api_response() );
	}

	/**
	 * Fetch connection info.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_connection_endpoint( \WP_REST_Request $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return rest_ensure_response( $this->get_connection_api_response() );
	}

	/**
	 * Connection state sent to client on initialization and after updates.
	 *
	 * @return array
	 */
	public function get_connection_api_response() {
		$force_connected = apply_filters( 'jetpack_boost_connection_bypass', false );

		return array(
			'connected'   => $force_connected || $this->is_connected(),
			'wpcomBlogId' => ( $force_connected || $this->is_connected() ) ? self::wpcom_blog_id() : null,
		);
	}

	/**
	 * Can user manage the connection?
	 *
	 * @return boolean | \WP_Error
	 */
	public function can_manage_connection() {
		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		$user_permissions_error_msg = __(
			'You do not have the correct user permissions to perform this action.
			Please contact your site admin if you think this is a mistake.',
			'jetpack-boost'
		);

		return new \WP_Error(
			'invalid_user_permission_jetpack_connect',
			$user_permissions_error_msg,
			array( 'status' => self::rest_authorization_required_code() )
		);
	}

	/**
	 * Contextual HTTP error code for authorization failure.
	 *
	 * Taken from rest_authorization_required_code() in WP-API plugin until is added to core.
	 *
	 * @see   https://github.com/WP-API/WP-API/commit/7ba0ae6fe4f605d5ffe4ee85b1cd5f9fb46900a6
	 *
	 * @since 4.3.0
	 *
	 * @return int
	 */
	public static function rest_authorization_required_code() {
		return is_user_logged_in() ? 403 : 401;
	}
}
