<?php
/**
 * The site-origin routes behind the checkpoint.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments\Identity;

/**
 * POST /identity/connect signs a connect request; DELETE /identity clears the
 * Passport. Logged-out commenters reach both, so the guard is a nonce.
 */
class REST_Controller {

	const NAMESPACE = 'jetpack-comments/v1';

	/**
	 * Register the routes.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	/**
	 * Register the connect and clear routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			self::NAMESPACE,
			'/identity/connect',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'permission_callback' => array( __CLASS__, 'check_nonce' ),
				'callback'            => array( __CLASS__, 'connect' ),
				'args'                => array(
					'provider' => array(
						'type'     => 'string',
						'required' => true,
					),
					'origin'   => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/identity',
			array(
				'methods'             => \WP_REST_Server::DELETABLE,
				'permission_callback' => array( __CLASS__, 'check_nonce' ),
				'callback'            => array( __CLASS__, 'clear' ),
			)
		);
	}

	/**
	 * Sign a connect request; returns the URL to open and the challenge to expect.
	 *
	 * @param \WP_REST_Request $request The request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function connect( \WP_REST_Request $request ) {
		if ( ! Checkpoint::is_available() ) {
			return new \WP_Error( 'not_available', __( 'Comment sign-in is not available on this site.', 'jetpack-comments' ), array( 'status' => 400 ) );
		}

		$signed = Checkpoint::signed_connect_url(
			(string) $request->get_param( 'provider' ),
			(string) $request->get_param( 'origin' )
		);

		return is_wp_error( $signed ) ? $signed : rest_ensure_response( $signed );
	}

	/**
	 * Clear the Passport cookie.
	 *
	 * @return \WP_REST_Response
	 */
	public static function clear() {
		Passport::clear();

		return rest_ensure_response( array( 'cleared' => true ) );
	}

	/**
	 * Verify the REST nonce.
	 *
	 * @return bool
	 */
	public static function check_nonce() {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- wp_verify_nonce hashes the raw value.
		$nonce = isset( $_SERVER['HTTP_X_WP_NONCE'] ) ? (string) wp_unslash( $_SERVER['HTTP_X_WP_NONCE'] ) : '';

		return (bool) wp_verify_nonce( $nonce, 'wp_rest' );
	}
}
