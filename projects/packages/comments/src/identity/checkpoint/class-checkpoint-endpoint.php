<?php
/**
 * What the checkpoint answers the browser directly.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * A fresh signed popup URL, whether an email has an account, and a way to log out.
 *
 * The routes are `wpcom/v2`, registered through the WPCOM REST API v2 loader, so
 * one definition is same-origin on self-hosted and Atomic and served through
 * `public-api.wordpress.com/wpcom/v2/sites/{id}/…` on Simple. Log out is
 * admin-ajax instead: only the site's own host can clear its first-party cookie,
 * and on Simple that host serves no REST API.
 *
 * All are open to anyone. Log out carries no nonce because one rendered for a
 * logged-out reader outlives the page cache; SameSite=Lax keeps a cross-site
 * request from carrying the passport, and one that says it is cross-site is refused.
 */
class Checkpoint_Endpoint extends WP_REST_Controller {

	const CONNECT_ROUTE = 'comments/identity/connect';
	const EMAIL_ROUTE   = 'comments/identity/email';
	const LOGOUT_ACTION = 'jetpack_comments_identity_logout';

	/**
	 * The instance registered without the WPCOM loader, which otherwise holds it.
	 *
	 * @var Checkpoint_Endpoint|null
	 */
	private static $instance = null;

	/**
	 * Whether the routes have been hooked.
	 *
	 * @var bool
	 */
	private static $hooked = false;

	/**
	 * Wire the routes onto `rest_api_init`. The loader instantiates this once.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = self::CONNECT_ROUTE;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes and the log-out action. Safe to call more than once.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$hooked ) {
			return;
		}

		self::$hooked = true;

		if ( function_exists( 'wpcom_rest_api_v2_load_plugin' ) ) {
			wpcom_rest_api_v2_load_plugin( self::class );
		} else {
			self::$instance = new self();
		}

		add_action( 'wp_ajax_nopriv_' . self::LOGOUT_ACTION, array( __CLASS__, 'log_out' ) );
		add_action( 'wp_ajax_' . self::LOGOUT_ACTION, array( __CLASS__, 'log_out' ) );
	}

	/**
	 * Where the browser fetches a fresh popup URL from, for this host.
	 *
	 * @return string
	 */
	public static function connect_url() {
		return self::route_url( self::CONNECT_ROUTE );
	}

	/**
	 * Where the browser asks whether an email belongs to an account, for this host.
	 *
	 * @return string
	 */
	public static function email_url() {
		return self::route_url( self::EMAIL_ROUTE );
	}

	/**
	 * A route's URL for this host.
	 *
	 * @param string $route The route under `wpcom/v2`.
	 * @return string
	 */
	private static function route_url( $route ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return sprintf( 'https://public-api.wordpress.com/wpcom/v2/sites/%d/%s', Checkpoint::blog_id(), $route );
		}

		return rest_url( 'wpcom/v2/' . $route );
	}

	/**
	 * Register the routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . self::CONNECT_ROUTE,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'connect' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'challenge' => array(
						'type'              => 'string',
						'required'          => true,
						'validate_callback' => array( Checkpoint::class, 'is_challenge' ),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . self::EMAIL_ROUTE,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'email' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'email' => array(
						'type'     => 'string',
						'format'   => 'email',
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * A signed popup URL.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function connect( WP_REST_Request $request ) {
		// On Simple the route is registered ahead of the loader's gates, because
		// a public-api request runs plugins_loaded on the wrong blog. Gate here.
		if ( ! Comments::is_enabled() ) {
			return new WP_Error( 'not_enabled', __( 'Sign-in is not available on this site.', 'jetpack-comments' ), array( 'status' => 404 ) );
		}

		$connect = Checkpoint::connect_url( $request->get_param( 'challenge' ) );

		if ( is_wp_error( $connect ) ) {
			return $connect;
		}

		$response = new WP_REST_Response( $connect );
		$response->header( 'Cache-Control', 'no-store' );

		return $response;
	}

	/**
	 * Whether an email belongs to a WordPress.com account, which Simple turns a guest comment away for.
	 *
	 * Only Simple has that rule and only Simple can answer; every other host says no.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function email( WP_REST_Request $request ) {
		if ( ! Comments::is_enabled() ) {
			return new WP_Error( 'not_enabled', __( 'Sign-in is not available on this site.', 'jetpack-comments' ), array( 'status' => 404 ) );
		}

		$account = false;

		if ( function_exists( 'is_email_wp_emails' ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom-only; add to stub-defs.php.
			$account = (bool) is_email_wp_emails( $request->get_param( 'email' ) );
		}

		$response = new WP_REST_Response( array( 'account' => $account ) );
		$response->header( 'Cache-Control', 'no-store' );

		return $response;
	}

	/**
	 * Take the passport back from the browser that sent it. Does not return.
	 *
	 * @return void
	 */
	public static function log_out() {
		nocache_headers();

		$site = isset( $_SERVER['HTTP_SEC_FETCH_SITE'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_SEC_FETCH_SITE'] ) ) : '';

		if ( '' !== $site && 'same-origin' !== $site ) {
			wp_send_json_error( array( 'code' => 'cross_site' ), 403, JSON_UNESCAPED_SLASHES );
		}

		Passport::revoke();

		wp_send_json_success( array( 'logged_out' => true ), 200, JSON_UNESCAPED_SLASHES );
	}
}
