<?php
/**
 * Class use to register REST API endpoints used by Account Protection
 *
 * @package automattic/jetpack-account-protection
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
	 * Register REST API endpoints.
	 *
	 * @return void
	 */
	public static function register_rest_routes() {
		// Ensure routes are only initialized once.
		static $routes_registered = false;
		if ( $routes_registered ) {
			return;
		}

		register_rest_route(
			'jetpack/v4',
			'/waf',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::update_account_protection',
				'permission_callback' => __CLASS__ . '::account_protection_permissions_callback',
			)
		);

		$routes_registered = true;
	}

	/**
	 * Update Account Protection Endpoint
	 *
	 * @param WP_REST_Request $request The API request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public static function update_account_protection( $request ) {
		// Password Detection Enabled
		if ( isset( $request[ Config::PASSWORD_DETECTION_ENABLED_OPTION_NAME ] ) ) {
			update_option( Config::PASSWORD_DETECTION_ENABLED_OPTION_NAME, $request->get_param( Config::PASSWORD_DETECTION_ENABLED_OPTION_NAME ) ? '1' : '' );
		}

		// Strong Passwords Enabled
		if ( isset( $request[ Config::STRONG_PASSWORDS_ENABLED_OPTION_NAME ] ) ) {
			update_option( Config::STRONG_PASSWORDS_ENABLED_OPTION_NAME, $request->get_param( Config::STRONG_PASSWORDS_ENABLED_OPTION_NAME ) ? '1' : '' );
		}

		return rest_ensure_response( Account_Protection_Settings::get_config() );
	}

	/**
	 * Account Protection Endpoint Permissions Callback
	 *
	 * @return bool|WP_Error True if user can view the Jetpack admin page.
	 */
	public static function account_protection_permissions_callback() {
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
