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
			'/toggle-account-protection',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::api_toggle_account_protection',
				'permission_callback' => __CLASS__ . '::account_protection_permissions_callback',
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/account-protection',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::api_get_account_protection',
				'permission_callback' => __CLASS__ . '::account_protection_permissions_callback',
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/account-protection',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::api_set_account_protection',
				'permission_callback' => __CLASS__ . '::account_protection_permissions_callback',
			)
		);

		$routes_registered = true;
	}

	/**
	 * Toggle Account Protection data for the API endpoint
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public static function api_toggle_account_protection() {
		$account_protection = new Account_Protection();

		if ( $account_protection->is_enabled() ) {
			$disabled = $account_protection->disable();
			if ( ! $disabled ) {
				return new WP_Error(
					'account_protection_disable_failed',
					__( 'An error occurred disabling account protection.', 'jetpack-account-protection' ),
					array( 'status' => 500 )
				);
			}

			return rest_ensure_response( true );
		}

		$enabled = $account_protection->enable();
		if ( ! $enabled ) {
			return new WP_Error(
				'account_protection_enable_failed',
				__( 'An error occurred enabling account protection.', 'jetpack-account-protection' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response( true );
	}

	/**
	 * Get Account Protection data for the API endpoint
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public static function api_get_account_protection() {
		return new WP_REST_Response( ( new Settings() )->get() );
	}

	/**
	 * Set Account Protection data for the API endpoint
	 *
	 * @param WP_REST_Request $request The API request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public static function api_set_account_protection( $request ) {
		// Password Detection Enabled
		if ( isset( $request[ Config::PASSWORD_DETECTION_ENABLED_OPTION_NAME ] ) ) {
			update_option( Config::PASSWORD_DETECTION_ENABLED_OPTION_NAME, $request->get_param( Config::PASSWORD_DETECTION_ENABLED_OPTION_NAME ) ? '1' : '' );
		}

		// Strong Passwords Enabled
		if ( isset( $request[ Config::STRONG_PASSWORDS_ENABLED_OPTION_NAME ] ) ) {
			update_option( Config::STRONG_PASSWORDS_ENABLED_OPTION_NAME, $request->get_param( Config::STRONG_PASSWORDS_ENABLED_OPTION_NAME ) ? '1' : '' );
		}

		return rest_ensure_response( ( new Settings() )->get() );
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
