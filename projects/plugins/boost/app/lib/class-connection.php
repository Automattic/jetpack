<?php
/**
 * Jetpack connection client.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack\Config as Jetpack_Config;
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

	public function __construct() {
		$this->manager = new Manager( 'jetpack-boost' );
	}

	public function init() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );

		$this->initialize_deactivate_disconnect();
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
		$this->manager->remove_connection();
	}

	/**
	 * Deactivate the connection on plugin disconnect for network-activated plugins.
	 */
	public function deactivate_disconnect_network() {
		if ( ! is_network_admin() ) {
			return;
		}

		foreach ( get_sites() as $s ) {
			switch_to_blog( (int) $s->blog_id );

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
		return defined( 'IS_WPCOM' ) && IS_WPCOM ? get_current_blog_id() : (int) \Jetpack_Options::get_option( 'id' );
	}

	/**
	 * True if the site is connected to WP.com.
	 *
	 * @return boolean
	 */
	public function is_connected() {
		/**
		 * Filter that fakes the connection to WordPress.com. Useful for testing.
		 *
		 * @param bool $connection Return true to fake the connection.
		 *
		 * @since   1.0.0
		 */
		if ( true === apply_filters( 'jetpack_boost_connection_bypass', false ) ) {
			return true;
		}

		return $this->manager->is_connected();
	}

	/**
	 * Register site using connection manager.
	 *
	 * @return true|\WP_Error The error object.
	 */
	public function register() {
		if ( $this->is_connected() ) {
			Analytics::record_user_event( 'using_existing_connection' );
			return true;
		}

		$result = $this->manager->register();

		if ( ! is_wp_error( $result ) ) {
			Analytics::record_user_event( 'established_connection' );
			Premium_Features::clear_cache();
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

		// Clear premium features cache to force a refresh.
		Premium_Features::clear_cache();

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		do_action( 'jetpack_boost_connection_established' );

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
		/**
		 * Filter that fakes the connection to WordPress.com. Useful for testing.
		 *
		 * @param bool $connection Return true to fake the connection.
		 *
		 * @since   1.0.0
		 */
		$force_connected = apply_filters( 'jetpack_boost_connection_bypass', false );

		$response = array(
			'connected'     => $force_connected || $this->is_connected(),
			'wpcomBlogId'   => ( $force_connected || $this->is_connected() ) ? self::wpcom_blog_id() : null,
			'userConnected' => $this->manager->is_user_connected(),
		);

		return $response;
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

	public function ensure_connection() {
		/**
		 * Filter that fakes the connection to WordPress.com. Useful for testing.
		 *
		 * @param bool $connection Return true to fake the connection.
		 *
		 * @since   1.0.0
		 */
		if ( ! apply_filters( 'jetpack_boost_connection_bypass', false ) ) {
			$jetpack_config = new Jetpack_Config();
			$jetpack_config->ensure(
				'connection',
				array(
					'slug'     => 'jetpack-boost',
					'name'     => 'Jetpack Boost',
					'url_info' => '', // Optional, URL of the plugin.
				)
			);
		}
	}
}
