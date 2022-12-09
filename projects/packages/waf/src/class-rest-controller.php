<?php
/**
 * Class use to register REST API endpoints used by the WAF
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Connection\REST_Connector;
use WP_Error;
use WP_REST_Server;

/**
 * Defines our endponts.
 */
class REST_Controller {
	/**
	 * Register REST API endpoints.
	 */
	public static function register_rest_routes() {
		register_rest_route(
			'jetpack/v4',
			'/waf',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::waf',
				'permission_callback' => __CLASS__ . '::waf_permissions_callback',
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/waf',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::update_waf',
				'permission_callback' => __CLASS__ . '::waf_permissions_callback',
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/waf/update-rules',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::update_rules',
				'permission_callback' => __CLASS__ . '::waf_permissions_callback',
			)
		);
	}

	/**
	 * Update rules endpoint
	 */
	public static function update_rules() {
		$success = true;
		$message = 'Rules updated succesfully';

		try {
			Waf_Runner::generate_rules();
		} catch ( \Exception $e ) {
			$success = false;
			$message = $e->getMessage();
		}

		return rest_ensure_response(
			array(
				'success' => $success,
				'message' => $message,
			)
		);
	}

	/**
	 * WAF Endpoint
	 */
	public static function waf() {
		return rest_ensure_response( Waf_Runner::get_config() );
	}

	/**
	 * Update WAF Endpoint
	 *
	 * @param WP_REST_Request $request The API request.
	 * @return WP_REST_Response
	 */
	public static function update_waf( $request ) {
		// IP Lists Enabled
		if ( isset( $request[ Waf_Runner::IP_LISTS_ENABLED_OPTION_NAME ] ) ) {
			update_option( Waf_Runner::IP_LISTS_ENABLED_OPTION_NAME, (bool) $request->get_param( Waf_Runner::IP_LISTS_ENABLED_OPTION_NAME ) );
		}

		// IP Block List
		if ( isset( $request[ Waf_Runner::IP_BLOCK_LIST_OPTION_NAME ] ) ) {
			update_option( Waf_Runner::IP_BLOCK_LIST_OPTION_NAME, $request[ Waf_Runner::IP_BLOCK_LIST_OPTION_NAME ] );
		}

		// IP Allow List
		if ( isset( $request[ Waf_Runner::IP_ALLOW_LIST_OPTION_NAME ] ) ) {
			update_option( Waf_Runner::IP_ALLOW_LIST_OPTION_NAME, $request[ Waf_Runner::IP_ALLOW_LIST_OPTION_NAME ] );
		}

		// Share Data
		if ( isset( $request[ Waf_Runner::SHARE_DATA_OPTION_NAME ] ) ) {
			update_option( Waf_Runner::SHARE_DATA_OPTION_NAME, (bool) $request[ Waf_Runner::SHARE_DATA_OPTION_NAME ] );
		}

		Waf_Runner::update_waf();

		return self::waf();
	}

	/**
	 * WAF Endpoint Permissions Callback
	 *
	 * @return bool|WP_Error True if user can view the Jetpack admin page.
	 */
	public static function waf_permissions_callback() {
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
