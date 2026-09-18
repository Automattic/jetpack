<?php
/**
 * Subscriptions from the comment form.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Automattic\Jetpack\Connection\Client;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * The subscription options, and the route that saves a signed-in reader's choices.
 */
class Subscriptions extends WP_REST_Controller {

	/**
	 * The route, under the `wpcom/v2` namespace.
	 */
	const ROUTE = 'comments/subscriptions';

	/**
	 * The admin-ajax action that dispatches the route on Simple.
	 */
	const ACTION = 'jetpack_comments_subscriptions';

	/**
	 * Singleton instance.
	 *
	 * @var Subscriptions|null
	 */
	private static $instance = null;

	/**
	 * Register the hooks. Safe to call more than once.
	 *
	 * @return Subscriptions
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Wire the hooks.
	 */
	private function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = self::ROUTE;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			add_action( 'wp_ajax_nopriv_' . self::ACTION, array( __CLASS__, 'dispatch' ) );
			add_action( 'wp_ajax_' . self::ACTION, array( __CLASS__, 'dispatch' ) );
		}
	}

	/**
	 * Settings the app reads.
	 *
	 * @return array
	 */
	public static function settings() {
		$is_wpcom  = defined( 'IS_WPCOM' ) && IS_WPCOM;
		$module    = class_exists( 'Jetpack_Subscriptions' );
		$logged_in = is_user_logged_in();

		return array(
			'subscriptions' => array(
				'blog'          => $is_wpcom || ( $module && ! empty( get_option( 'stb_enabled', 1 ) ) ),
				'comments'      => $is_wpcom || ( $module && ! empty( get_option( 'stc_enabled', 1 ) ) ),
				'notifications' => $logged_in && $is_wpcom,
				'url'           => $is_wpcom ? admin_url( 'admin-ajax.php' ) : rest_url( 'wpcom/v2/' . self::ROUTE ),
				'action'        => $is_wpcom ? self::ACTION : '',
				'nonce'         => $logged_in ? wp_create_nonce( 'wp_rest' ) : '',
			),
		);
	}

	/**
	 * Register the route.
	 *
	 * @return void
	 */
	public function register_routes() {
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
	 * Permission check: same-origin, and the feature on.
	 *
	 * @return true|WP_Error
	 */
	public function permission_check() {
		$site = isset( $_SERVER['HTTP_SEC_FETCH_SITE'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_SEC_FETCH_SITE'] ) ) : '';

		if ( '' !== $site && 'same-origin' !== $site ) {
			return new WP_Error( 'cross_site', __( 'Invalid request.', 'jetpack-comments' ), array( 'status' => 403 ) );
		}

		if ( ! Comments::is_enabled() ) {
			return new WP_Error( 'not_enabled', __( 'Subscriptions are not available on this site.', 'jetpack-comments' ), array( 'status' => 404 ) );
		}

		return true;
	}

	/**
	 * Relay the reader's email and change to WordPress.com and return its answer.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );

		if ( ! get_post( $post_id ) || ! Comment_Form::enabled_for_post_type( $post_id ) ) {
			return new WP_Error( 'invalid_post', __( 'Invalid request.', 'jetpack-comments' ), array( 'status' => 400 ) );
		}

		if ( is_user_logged_in() ) {
			$email    = (string) wp_get_current_user()->user_email;
			$provider = 'site';
		} else {
			$passport = Passport::read();
			$code     = sanitize_text_field( (string) $request->get_param( 'code' ) );

			if ( null === $passport && '' === $code ) {
				return new WP_Error( 'not_signed_in', __( 'Sign in to manage subscriptions.', 'jetpack-comments' ), array( 'status' => 401 ) );
			}

			if ( null === $passport ) {
				$passport = Checkpoint::exchange( $code );

				if ( is_wp_error( $passport ) ) {
					return $passport;
				}

				Passport::issue( $passport );
			}

			$email    = (string) $passport['email'];
			$provider = (string) $passport['provider'];
		}

		$body   = array( 'available' => false );
		$status = 200;

		if ( '' !== $email ) {
			$response = Client::wpcom_json_api_request_as_blog(
				sprintf( '/sites/%d/comments/subscriptions', Checkpoint::blog_id() ),
				'2',
				array(
					'method'  => 'POST',
					'headers' => array( 'Content-Type' => 'application/json; charset=utf-8' ),
					'timeout' => 10,
				),
				(string) wp_json_encode(
					array(
						'email'    => $email,
						'provider' => $provider,
						'post_id'  => $post_id,
						'field'    => sanitize_key( (string) $request->get_param( 'field' ) ),
						'value'    => sanitize_text_field( (string) $request->get_param( 'value' ) ),
					),
					JSON_UNESCAPED_SLASHES
				),
				'wpcom'
			);

			if ( is_wp_error( $response ) ) {
				return $response;
			}

			$status = (int) wp_remote_retrieve_response_code( $response );
			$body   = json_decode( wp_remote_retrieve_body( $response ), true );

			if ( ! is_array( $body ) ) {
				$body   = array( 'code' => 'server_error' );
				$status = 500;
			}
		}

		$response = new WP_REST_Response( $body, $status );
		$response->header( 'Cache-Control', 'no-store' );

		return $response;
	}

	/**
	 * Simple only: run the route from admin-ajax. Does not return.
	 *
	 * @return void
	 */
	public static function dispatch() {
		nocache_headers();

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/' . self::ROUTE );
		$request->set_body_params( wp_unslash( $_POST ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- The route validates and sanitizes as it would any request.

		$response = rest_do_request( $request );

		wp_send_json( rest_get_server()->response_to_data( $response, false ), $response->get_status(), JSON_UNESCAPED_SLASHES );
	}
}
