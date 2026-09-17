<?php
/**
 * What the form asks the site about subscriptions.
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
 * One route: read what a signed-in reader is subscribed to, or change one option.
 *
 * A `wpcom/v2` route on the site, served by its own REST API on self-hosted and
 * Atomic. Simple serves REST only from public-api, which never receives the
 * passport, a host-only cookie on a mapped domain, and cannot set one for a
 * fresh sign-in. So there the same route is dispatched in process from an
 * admin-ajax action, as the log-out is.
 *
 * It carries no nonce for a passport holder, because a page rendered for a
 * logged-out reader is cached and shared, so a nonce in it is everyone's.
 * What stands in is what the log-out relies on: the browser has to say the
 * request is same-origin, and the cookies it acts on are SameSite=Lax, so a
 * page elsewhere cannot send them. A reader logged in to the site gets the
 * REST nonce, which cookie authentication needs to see them at all.
 */
class Subscriptions_Endpoint extends WP_REST_Controller {

	/**
	 * The route, under the `wpcom/v2` namespace.
	 */
	const ROUTE = 'comments/subscriptions';

	/**
	 * The admin-ajax action that dispatches the route on Simple.
	 */
	const ACTION = 'jetpack_comments_subscriptions';

	/**
	 * Whether the hooks are in place.
	 *
	 * @var bool
	 */
	private static $hooked = false;

	/**
	 * Register the route, and on Simple the action that reaches it. Safe to call more than once.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$hooked ) {
			return;
		}

		self::$hooked = true;

		add_action( 'rest_api_init', array( __CLASS__, 'register' ) );

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			add_action( 'wp_ajax_nopriv_' . self::ACTION, array( __CLASS__, 'dispatch' ) );
			add_action( 'wp_ajax_' . self::ACTION, array( __CLASS__, 'dispatch' ) );
		}
	}

	/**
	 * Register the route on `rest_api_init`.
	 *
	 * @return void
	 */
	public static function register() {
		( new self() )->register_routes();
	}

	/**
	 * Where the browser posts to, for this host.
	 *
	 * @return string
	 */
	public static function url() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return admin_url( 'admin-ajax.php' );
		}

		return rest_url( 'wpcom/v2/' . self::ROUTE );
	}

	/**
	 * Register the route.
	 *
	 * @return void
	 */
	public function register_routes() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = self::ROUTE;

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'handle' ),
				'permission_callback' => array( $this, 'permission_check' ),
				'args'                => array(
					'post_id' => array(
						'type'     => 'integer',
						'required' => true,
						'minimum'  => 1,
					),
					'field'   => array(
						'type'    => 'string',
						'default' => '',
					),
					'value'   => array(
						'type'    => 'string',
						'default' => '',
					),
					'code'    => array(
						'type'    => 'string',
						'default' => '',
					),
				),
			)
		);
	}

	/**
	 * Only from this site's own pages.
	 *
	 * @return true|WP_Error
	 */
	public function permission_check() {
		$site = isset( $_SERVER['HTTP_SEC_FETCH_SITE'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_SEC_FETCH_SITE'] ) ) : '';

		if ( '' !== $site && 'same-origin' !== $site ) {
			return new WP_Error( 'cross_site', __( 'Invalid request.', 'jetpack-comments' ), array( 'status' => 403 ) );
		}

		// On Simple the route is registered ahead of the loader's gates, which skip admin-ajax. Gate here.
		if ( ! Comments::is_enabled() ) {
			return new WP_Error( 'not_enabled', __( 'Subscriptions are not available on this site.', 'jetpack-comments' ), array( 'status' => 404 ) );
		}

		return true;
	}

	/**
	 * Answer the form with what WordPress.com said, status and all.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );

		if ( ! get_post( $post_id ) || ! Comment_Form::enabled_for_post_type( $post_id ) ) {
			return new WP_Error( 'invalid_post', __( 'Invalid request.', 'jetpack-comments' ), array( 'status' => 400 ) );
		}

		$email = Subscriptions::subscriber( sanitize_text_field( (string) $request->get_param( 'code' ) ) );

		if ( null === $email ) {
			return new WP_Error( 'not_signed_in', __( 'Sign in to manage subscriptions.', 'jetpack-comments' ), array( 'status' => 401 ) );
		}

		if ( is_wp_error( $email ) ) {
			return $email;
		}

		if ( '' === $email ) {
			return $this->respond( array( 'available' => false ), 200 );
		}

		$response = Subscriptions::request(
			$email,
			$post_id,
			sanitize_key( (string) $request->get_param( 'field' ) ),
			sanitize_text_field( (string) $request->get_param( 'value' ) )
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		return $this->respond( is_array( $body ) ? $body : array( 'code' => 'server_error' ), $status >= 100 && $status < 600 ? $status : 500 );
	}

	/**
	 * A response nothing should cache.
	 *
	 * @param array $body   What to send.
	 * @param int   $status The status.
	 * @return WP_REST_Response
	 */
	private function respond( array $body, $status ) {
		$response = new WP_REST_Response( $body, $status );
		$response->header( 'Cache-Control', 'no-store' );

		return $response;
	}

	/**
	 * Simple only: run the route from admin-ajax, the one same-origin entry the site host has. Does not return.
	 *
	 * @return void
	 */
	public static function dispatch() {
		nocache_headers();

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/' . self::ROUTE );
		$request->set_body_params( wp_unslash( $_POST ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- The route validates and sanitizes as it would any request.

		$response = rest_do_request( $request );
		$server   = rest_get_server();

		wp_send_json( $server->response_to_data( $response, false ), $response->get_status(), JSON_UNESCAPED_SLASHES );
	}
}
