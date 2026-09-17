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
 * What the form offers to subscribe to, and the route it saves a signed-in reader's choices through.
 *
 * It is all email. A guest's choices post with the comment, in the fields each
 * host's own subscription handler reads. A signed-in reader's are saved as they
 * are made: the route relays their email to WordPress.com over the blog
 * connection, `wpcom/v2/sites/{id}/comments/subscriptions`, and hands back what
 * it answered. WordPress.com's rules apply there: a login's own address is
 * activated at once and offered the reader options, any other address confirms
 * by email first.
 *
 * The route is served by the site's own REST API on self-hosted and Atomic.
 * Simple serves REST only from public-api, which never receives the passport,
 * a host-only cookie on a mapped domain, and cannot set one for a fresh
 * sign-in. So there the same route is dispatched in process from an admin-ajax
 * action, as the log-out is.
 *
 * It carries no nonce for a passport holder, because a page rendered for a
 * logged-out reader is cached and shared, so a nonce in it is everyone's.
 * What stands in is what the log-out relies on: the browser has to say the
 * request is same-origin, and the cookies it acts on are SameSite=Lax, so a
 * page elsewhere cannot send them. A reader logged in to the site gets the
 * REST nonce, which cookie authentication needs to see them at all.
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
	 * Register the route, and on Simple the action that reaches it. Safe to call more than once.
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
	 * What the app needs to draw and save the options.
	 *
	 * Simple always offered both email options under Verbum, whatever the blog's
	 * own setting said, so that stays. Elsewhere it is the Subscriptions module's
	 * setting, which only counts while the module is loaded to handle what the
	 * form posts.
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
				// Notifications reach a WordPress.com account, which a site login only is on Simple.
				'notifications' => $logged_in && $is_wpcom,
				'url'           => $is_wpcom ? admin_url( 'admin-ajax.php' ) : rest_url( 'wpcom/v2/' . self::ROUTE ),
				'action'        => $is_wpcom ? self::ACTION : '',
				// REST cookie authentication sees a site login only with this.
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
	 * Relay the reader's email and their change to WordPress.com, and answer with what it said, status and all.
	 *
	 * A fresh popup sign-in holds only a code until its first comment posts.
	 * Given that code, it is redeemed here and the passport issued now, so the
	 * comment that follows posts on the passport instead.
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
						// A WordPress.com sign-in is offered the reader options by its account, found by email.
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
	 * Simple only: run the route from admin-ajax, the one same-origin entry the site host has. Does not return.
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
