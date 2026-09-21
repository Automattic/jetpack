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
 * The subscription options, and the one place a subscription is written.
 *
 * Everything reaches `wpcom/v2/sites/{id}/comments/subscriptions` over the blog
 * connection, served in process on Simple. A signed-in reader's toggles go there
 * as they are flipped, through the route below. A guest has no email until they
 * submit, so their choices ride along as hidden fields and are sent from
 * `comment_post` with the address they commented under.
 *
 * The route is served by the site's own REST API on self-hosted and Atomic.
 * Simple serves REST only from public-api, which never receives the passport, a
 * host-only cookie on a mapped domain, so there the same route is dispatched in
 * process from an admin-ajax action, as the log-out is.
 *
 * It carries no nonce for a passport holder, because a page rendered for a
 * logged-out reader is cached and shared, so a nonce in it is everyone's. What
 * stands in is what the log-out relies on: the browser has to say the request is
 * same-origin, and the cookies it acts on are SameSite=Lax. A reader logged in
 * to the site gets the REST nonce, which cookie authentication needs.
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
	 * What a caller may set. An empty string leaves that option alone.
	 */
	const CHOICE = array(
		'email_posts'    => array( '', '0', '1' ),
		'email_comments' => array( '', '0', '1' ),
		'notify_posts'   => array( '', '0', '1' ),
		'frequency'      => array( '', 'instantly', 'daily', 'weekly' ),
	);

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
		add_action( 'comment_post', array( __CLASS__, 'comment_posted' ), 50, 2 );

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
		$args = array(
			'post_id' => array(
				'type'     => 'integer',
				'required' => true,
				'minimum'  => 1,
			),
			'code'    => array(
				'type'    => 'string',
				'default' => '',
			),
		);

		foreach ( self::CHOICE as $name => $values ) {
			$args[ $name ] = array(
				'type'    => 'string',
				'default' => '',
				'enum'    => $values,
			);
		}

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'handle' ),
				'permission_callback' => array( $this, 'permission_check' ),
				'args'                => $args,
			)
		);
	}

	/**
	 * Only from this site's own pages, and only where the feature is on.
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
	 * Relay a signed-in reader's choice and return what WordPress.com said.
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

		if ( '' === $email ) {
			$response = new WP_REST_Response( array( 'available' => false ), 200 );
			$response->header( 'Cache-Control', 'no-store' );

			return $response;
		}

		$choice = array();

		foreach ( array_keys( self::CHOICE ) as $name ) {
			$choice[ $name ] = (string) $request->get_param( $name );
		}

		$result = self::send( $email, $provider, $post_id, $choice );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$response = new WP_REST_Response( $result['body'], $result['status'] );
		$response->header( 'Cache-Control', 'no-store' );

		return $response;
	}

	/**
	 * Subscribe a guest to what they ticked, once their comment is in.
	 *
	 * Sent at shutdown so the commenter is not kept waiting on WordPress.com,
	 * and only for a comment that was not held as spam.
	 *
	 * @param int        $comment_id The comment.
	 * @param int|string $approved   1, 0 or 'spam'.
	 * @return void
	 */
	public static function comment_posted( $comment_id, $approved ) {
		if ( 'spam' === $approved ) {
			return;
		}

		$choice = array();

		foreach ( self::CHOICE as $name => $values ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Comment_Form::verify_nonce() ran on pre_comment_on_post.
			$posted          = isset( $_POST[ self::field( $name ) ] ) ? sanitize_text_field( wp_unslash( $_POST[ self::field( $name ) ] ) ) : '';
			$choice[ $name ] = in_array( $posted, $values, true ) ? $posted : '';
		}

		if ( '1' !== $choice['email_posts'] && '1' !== $choice['email_comments'] ) {
			return;
		}

		$comment = get_comment( $comment_id );

		if ( ! $comment instanceof \WP_Comment || ! is_email( $comment->comment_author_email ) ) {
			return;
		}

		$email   = (string) $comment->comment_author_email;
		$post_id = (int) $comment->comment_post_ID;

		add_action(
			'shutdown',
			static function () use ( $email, $post_id, $choice ) {
				self::send( $email, 'guest', $post_id, $choice );
			}
		);
	}

	/**
	 * The POST field a choice rides in on a guest's comment.
	 *
	 * @param string $name One of CHOICE.
	 * @return string
	 */
	public static function field( $name ) {
		return 'jetpack_comments_' . $name;
	}

	/**
	 * Ask WordPress.com to apply a choice for an email, and hand back its answer.
	 *
	 * @param string $email    Whose subscriptions.
	 * @param string $provider How they identified, as the sign-in providers are named.
	 * @param int    $post_id  The post the comment thread belongs to.
	 * @param array  $choice   Keyed by CHOICE, empty strings for what to leave alone.
	 * @return array|WP_Error status and body.
	 */
	private static function send( $email, $provider, $post_id, array $choice ) {
		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/comments/subscriptions', Checkpoint::blog_id() ),
			'2',
			array(
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json; charset=utf-8' ),
				'timeout' => 10,
			),
			(string) wp_json_encode(
				array_merge(
					array(
						'email'    => $email,
						'provider' => $provider,
						'post_id'  => (int) $post_id,
					),
					$choice
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
			return array(
				'status' => 500,
				'body'   => array( 'code' => 'server_error' ),
			);
		}

		return array(
			'status' => $status >= 100 && $status < 600 ? $status : 500,
			'body'   => $body,
		);
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
