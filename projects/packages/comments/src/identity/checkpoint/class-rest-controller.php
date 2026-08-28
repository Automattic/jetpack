<?php
/**
 * The site-origin endpoints that redeem and clear a comment identity.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments\Identity;

/**
 * Two same-origin routes the front end calls:
 *
 * - POST /identity/connect signs a connect request as this blog and returns
 *   the URL the popup should open, with the challenge to expect back.
 * - DELETE /identity clears the Passport cookie.
 *
 * The exchange itself is not a route: it runs when the comment posts, in
 * Comment_Hooks. A logged-out commenter reaches both routes, so the guard is a
 * nonce, not a capability.
 */
class REST_Controller {

	/**
	 * REST namespace the routes live under.
	 */
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
	 * Register the redeem and clear routes.
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
	 * Sign a connect request and return the URL to open and the challenge to
	 * expect back.
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

		if ( is_wp_error( $signed ) ) {
			return $signed;
		}

		return rest_ensure_response( $signed );
	}

	/**
	 * Clear the identity cookie.
	 *
	 * @return \WP_REST_Response
	 */
	public static function clear() {
		Passport::clear();

		return rest_ensure_response( array( 'cleared' => true ) );
	}

	/**
	 * Verify the REST nonce, in a way a page cache cannot defeat.
	 *
	 * A cache can serve a logged-in reader a copy rendered for nobody, so the
	 * nonce they hold is the anonymous one. wp_verify_nonce() folds the session
	 * token from the logged-in cookie into the hash, so clearing the current
	 * user is not enough on its own: the cookie has to go too.
	 *
	 * @return bool
	 */
	public static function check_nonce() {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- wp_verify_nonce hashes the raw value.
		$nonce = isset( $_SERVER['HTTP_X_WP_NONCE'] ) ? (string) wp_unslash( $_SERVER['HTTP_X_WP_NONCE'] ) : '';

		if ( wp_verify_nonce( $nonce, 'wp_rest' ) ) {
			return true;
		}

		if ( ! defined( 'LOGGED_IN_COOKIE' ) || ! isset( $_COOKIE[ LOGGED_IN_COOKIE ] ) ) {
			return false;
		}

		$user_id = get_current_user_id();
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- stashed and restored untouched.
		$cookie = $_COOKIE[ LOGGED_IN_COOKIE ];

		unset( $_COOKIE[ LOGGED_IN_COOKIE ] );
		wp_set_current_user( 0 );

		$valid = (bool) wp_verify_nonce( $nonce, 'wp_rest' );

		$_COOKIE[ LOGGED_IN_COOKIE ] = $cookie;
		wp_set_current_user( $user_id );

		return $valid;
	}
}
