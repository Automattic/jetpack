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
 * The subscription options, and the route that relays a reader's choices to WordPress.com.
 *
 * On Simple the site host serves no REST API and the passport is a host-only cookie, so the
 * route is dispatched in process from admin-ajax. A passport holder carries no nonce, since
 * their page is cached and shared; SameSite=Lax and Sec-Fetch-Site stand in. A site login's
 * REST nonce is checked here because the admin-ajax dispatch never runs cookie authentication.
 */
class Subscriptions extends WP_REST_Controller {

	/**
	 * The route.
	 */
	const ROUTE = 'comments/subscriptions';

	/**
	 * The admin-ajax action on Simple.
	 */
	const ACTION = 'jetpack_comments_subscriptions';

	/**
	 * Accepted values per option. An empty string leaves that option alone.
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
	 * Register the hooks once.
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

		if ( is_user_logged_in() ) {
			$nonce = isset( $_SERVER['HTTP_X_WP_NONCE'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_WP_NONCE'] ) ) : '';

			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				return new WP_Error( 'invalid_nonce', __( 'Invalid request.', 'jetpack-comments' ), array( 'status' => 403 ) );
			}
		}

		// On Simple the route is registered on every site.
		if ( ! Comments::is_enabled() ) {
			return new WP_Error( 'not_enabled', __( 'Subscriptions are not available on this site.', 'jetpack-comments' ), array( 'status' => 404 ) );
		}

		return true;
	}

	/**
	 * Relay a signed-in reader's choice and return what WordPress.com said.
	 *
	 * A fresh popup sign-in's code is redeemed here, and the answer says `redeemed` whatever
	 * WordPress.com replied, so the form stops posting the spent code.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle( WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );

		if ( ! get_post( $post_id ) || ! Comment_Form::enabled_for_post_type( $post_id ) ) {
			return new WP_Error( 'invalid_post', __( 'Invalid request.', 'jetpack-comments' ), array( 'status' => 400 ) );
		}

		$redeemed     = false;
		$commenter_id = '';

		if ( is_user_logged_in() ) {
			$email = (string) wp_get_current_user()->user_email;
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
				$redeemed = true;
			}

			$email        = (string) $passport['email'];
			$commenter_id = (string) $passport['site_commenter_id'];
		}

		$status = 200;
		$body   = array( 'available' => false );

		if ( '' !== $email ) {
			$choice = array();

			foreach ( array_keys( self::CHOICE ) as $name ) {
				$choice[ $name ] = (string) $request->get_param( $name );
			}

			$result = self::send( $email, $post_id, $choice, $commenter_id, true );
			$status = $result['status'];
			$body   = $result['body'];
		}

		if ( $redeemed ) {
			$body['redeemed'] = true;
		}

		$response = new WP_REST_Response( $body, $status );
		$response->header( 'Cache-Control', 'no-store' );

		return $response;
	}

	/**
	 * Subscribe a guest to what they ticked, once their comment is in.
	 *
	 * Sent at shutdown so the commenter is not kept waiting on WordPress.com.
	 *
	 * @param int        $comment_id The comment.
	 * @param int|string $approved   1, 0, 'spam' or 'trash'.
	 * @return void
	 */
	public static function comment_posted( $comment_id, $approved ) {
		// On Simple this is hooked on every site.
		if ( 'spam' === $approved || 'trash' === $approved || ! Comments::is_enabled() ) {
			return;
		}

		$choice = array();

		foreach ( self::CHOICE as $name => $values ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Comment_Form::verify_nonce() ran on pre_comment_on_post.
			$posted          = isset( $_POST[ 'jetpack_comments_' . $name ] ) ? sanitize_text_field( wp_unslash( $_POST[ 'jetpack_comments_' . $name ] ) ) : '';
			$choice[ $name ] = in_array( $posted, $values, true ) ? $posted : '';
		}

		if ( '1' !== $choice['email_posts'] && '1' !== $choice['email_comments'] ) {
			return;
		}

		$comment = get_comment( $comment_id );

		if ( ! $comment instanceof \WP_Comment || ! is_email( $comment->comment_author_email ) || ! Comment_Form::enabled_for_post_type( (int) $comment->comment_post_ID ) ) {
			return;
		}

		$email   = (string) $comment->comment_author_email;
		$post_id = (int) $comment->comment_post_ID;

		add_action(
			'shutdown',
			static function () use ( $email, $post_id, $choice ) {
				self::send( $email, $post_id, $choice );
			}
		);
	}

	/**
	 * Relay a choice to WordPress.com.
	 *
	 * @param string $email        Whose subscriptions.
	 * @param int    $post_id      The post.
	 * @param array  $choice       Keyed by CHOICE.
	 * @param string $commenter_id The passport's site_commenter_id, which WordPress.com can verify.
	 * @param bool   $signed_in    Whether the site identified the reader; a guest's typed address may only opt in.
	 * @return array status and body.
	 */
	private static function send( $email, $post_id, array $choice, $commenter_id = '', $signed_in = false ) {
		$body = array_merge(
			array(
				'email'   => $email,
				'post_id' => (int) $post_id,
			),
			$choice
		);

		if ( '' !== $commenter_id ) {
			$body['site_commenter_id'] = $commenter_id;
		}

		if ( $signed_in ) {
			$body['signed_in'] = true;
		}

		// For bkismet, as the Jetpack Subscriptions call passes them.
		$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? filter_var( wp_unslash( $_SERVER['REMOTE_ADDR'] ), FILTER_VALIDATE_IP ) : false;

		if ( $ip ) {
			$body['ip'] = $ip;
		}

		if ( ! empty( $_SERVER['HTTP_USER_AGENT'] ) ) {
			$body['user_agent'] = sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) );
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/comments/subscriptions', Checkpoint::blog_id() ),
			'2',
			array(
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json; charset=utf-8' ),
				'timeout' => 10,
			),
			(string) wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
			'wpcom'
		);

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = is_wp_error( $response ) ? null : json_decode( wp_remote_retrieve_body( $response ), true );

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
