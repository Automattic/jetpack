<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Register WP REST API endpoints for Jetpack.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Extensions\Premium_Content\subscription_service;

// Disable direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Load WP_Error for error messages.
require_once ABSPATH . '/wp-includes/class-wp-error.php';

/**
 * Class Jetpack_Core_Json_Api_Endpoints
 *
 * @since 4.3.0
 */
class Jetpack_Memberships_Json_Api_Endpoints {

	/**
	 * Declare the Jetpack Memberships REST API endpoints.
	 *
	 * @since 4.3.0
	 */
	public static function register_endpoints() {

		// Save subscriber token and redirect
		register_rest_route(
			'jetpack/v4',
			'/subscribers/auth',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::set_subscriber_cookie_and_redirect',
				'permission_callback' => true,
			)
		);

		// Save subscriber token and redirect
		register_rest_route(
			'jetpack/v4',
			'/subscribers/has_token_refreshed',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::has_token_refreshed',
				'permission_callback' => true,
				'args'                => array(
					'old_token' => array( 'type' => 'string' ),
				),
			)
		);
	}

	/**
	 * Set subscriber cookie and redirect
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public static function set_subscriber_cookie_and_redirect() {
		require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/subscription-service/include.php';
		$subscription_service = subscription_service();
		$token                = $subscription_service->get_and_set_token_from_request();
		$payload              = $subscription_service->decode_token( $token );
		$is_valid_token       = ! empty( $payload );
		if ( $is_valid_token && isset( $payload['redirect_url'] ) ) {
			return new WP_REST_Response( null, 302, array( 'location' => $payload['redirect_url'] ) );
		}
		return new WP_Error( 'invalid-token', 'Invalid Token' );
	}

	/**
	 * Set subscriber cookie and redirect
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public static function has_token_refreshed() {
		require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/subscription-service/include.php';
		$subscription_service = subscription_service();
		$token                = $subscription_service->get_and_set_token_from_request();
		$payload              = $subscription_service->decode_token( $token );
		$is_valid_token       = ! empty( $payload );
		if ( $is_valid_token && isset( $payload['redirect_url'] ) ) {
			return new WP_REST_Response( null, 302, array( 'location' => $payload['redirect_url'] ) );
		}
		return new WP_Error( 'invalid-token', 'Invalid Token' );
	}
} // class end
