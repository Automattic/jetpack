<?php
/**
 * Class use to register REST API endpoints used by the Accont Protection module.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Account_Protection;

use Automattic\Jetpack\Connection\REST_Connector;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Defines our endponts.
 */
class REST_Controller {
	/**
	 * Tracks whether routes have already been registered.
	 *
	 * @var bool
	 */
	private $routes_registered = false;

	/**
	 * Register REST API endpoints.
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		// Ensure routes are only initialized once.
		if ( $this->routes_registered ) {
			return;
		}

		register_rest_route(
			'jetpack/v4',
			'/account-protection',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_settings' ),
				'permission_callback' => array( $this, 'permissions_callback' ),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/account-protection',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_settings' ),
				'permission_callback' => array( $this, 'permissions_callback' ),
			)
		);

		$this->routes_registered = true;
	}

	/**
	 * Account Protection Settings Endpoint
	 *
	 * @return WP_REST_Response
	 */
	public function get_settings() {
		return rest_ensure_response(
			array(
				Account_Protection::STRICT_MODE_OPTION_NAME => get_option( Account_Protection::STRICT_MODE_OPTION_NAME ),
			)
		);
	}

	/**
	 * Update Account Protection Settings Endpoint
	 *
	 * @param WP_REST_Request $request The API request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_settings( $request ) {
		// Strict Mode
		if ( isset( $request[ Account_Protection::STRICT_MODE_OPTION_NAME ] ) ) {
			update_option( Account_Protection::STRICT_MODE_OPTION_NAME, $request[ Account_Protection::STRICT_MODE_OPTION_NAME ] ? '1' : '' );
		}

		return $this->get_settings();
	}

	/**
	 * Account Protection Endpoint Permissions Callback
	 *
	 * @return bool|WP_Error True if user can view the Jetpack admin page.
	 */
	public function permissions_callback() {
		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_manage_options',
			REST_Connector::get_user_permissions_error_msg(),
			array( 'status' => rest_authorization_required_code() )
		);
	}
}
