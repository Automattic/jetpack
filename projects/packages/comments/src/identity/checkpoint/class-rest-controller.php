<?php
/**
 * The site-origin route behind the checkpoint.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments\Identity;

/**
 * POST /identity/connect signs a fresh connect request, for when the one
 * minted with the page has lapsed or been used. Logged-out commenters reach
 * it, so the guard is a nonce.
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
	 * Register the connect route.
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
					'origin' => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * Sign a connect request; returns the URL to open, the challenge to expect,
	 * and when the signature expires.
	 *
	 * The browser's own Origin header, sent on every POST and unforgeable, has
	 * to agree with the origin asked for: neither is trusted about itself.
	 *
	 * @param \WP_REST_Request $request The request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function connect( \WP_REST_Request $request ) {
		if ( ! Checkpoint::is_available() ) {
			return new \WP_Error( 'not_available', __( 'Comment sign-in is not available on this site.', 'jetpack-comments' ), array( 'status' => 400 ) );
		}

		$origin = (string) $request->get_param( 'origin' );
		$header = isset( $_SERVER['HTTP_ORIGIN'] ) ? (string) wp_unslash( $_SERVER['HTTP_ORIGIN'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- compared, never output.

		if ( $header !== $origin ) {
			return new \WP_Error( 'invalid_origin', __( 'That origin is not this site.', 'jetpack-comments' ), array( 'status' => 400 ) );
		}

		$signed = Checkpoint::signed_connect_url( $origin );

		return is_wp_error( $signed ) ? $signed : rest_ensure_response( $signed );
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
