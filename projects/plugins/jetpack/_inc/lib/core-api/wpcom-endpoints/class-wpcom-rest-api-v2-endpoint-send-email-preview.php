<?php
/**
 * Handles the sending of email previews via the WordPress.com REST API.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_Send_Email_Preview
 * Handles the sending of email previews via the WordPress.com REST API
 */
class WPCOM_REST_API_V2_Endpoint_Send_Email_Preview extends WP_REST_Controller {

	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->base_api_path                   = 'wpcom';
		$this->version                         = 'v2';
		$this->namespace                       = $this->base_api_path . '/' . $this->version;
		$this->rest_base                       = '/send-email-preview';
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = true;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Registers the routes for blogging prompts.
	 *
	 * @see register_rest_route()
	 */
	public function register_routes() {
		$options = array(
			'show_in_index'       => true,
			'methods'             => 'POST',
			// if this is not a wpcom site, we need to proxy the request to wpcom
			'callback'            => ( ( new Host() )->is_wpcom_simple() ) ? array(
				$this,
				'send_email_preview',
			) : array( $this, 'proxy_request_to_wpcom_as_user' ),
			'permission_callback' => array( $this, 'permissions_check' ),
			'args'                => array(
				'id'    => array(
					'description' => __( 'Unique identifier for the post.', 'jetpack' ),
					'type'        => 'integer',
				),
				'email' => array(
					'description' => __( 'Optional recipient address. Defaults to the current user. A different address is only accepted from users who may add subscribers, and is subject to the same abuse checks.', 'jetpack' ),
					'type'        => 'string',
				),
			),
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			$options
		);
	}

	/**
	 * Checks if the user is connected and has access to edit the post
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return true|WP_Error True if the request has edit access, WP_Error object otherwise.
	 */
	public function permissions_check( $request ) {
		if ( ! ( new Host() )->is_wpcom_simple() ) {
			if ( ! ( new Manager() )->is_user_connected() ) {
				return new WP_Error(
					'rest_cannot_send_email_preview',
					__( 'Please connect your user account to WordPress.com', 'jetpack' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}
		}

		$post = get_post( $request->get_param( 'id' ) );

		if ( is_wp_error( $post ) ) {
			return $post;
		}

		if ( $post && ! current_user_can( 'edit_post', $post->ID ) ) {
			return new WP_Error(
				'rest_forbidden_context',
				__( 'Please connect your user account to WordPress.com', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Sends an email preview of a post to the current user.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function send_email_preview( $request ) {
		$post_id = $request['id'];
		$post    = get_post( $post_id );

		// Return error if the post cannot be retrieved
		if ( is_wp_error( $post ) ) {
			return $post;
		}

		// Check if the user's email is verified
		if ( Email_Verification::is_email_unverified() ) {
			return new WP_Error( 'unverified', __( 'Your email address must be verified.', 'jetpack' ), array( 'status' => rest_authorization_required_code() ) );
		}

		$current_user = wp_get_current_user();
		$self_email   = $current_user->user_email;
		$email        = $self_email;

		// Resolve the recipient. The address defaults to the caller's own verified
		// email; a caller-supplied address is only honored after it clears the same
		// gates as adding that person as a subscriber. Self-sends keep their
		// historical behavior and skip the guard entirely.
		//
		// The self-send fast path relies on the caller's own address matching
		// $current_user->user_email. That holds because this callback only runs on
		// wpcom (is_wpcom_simple(); Atomic/Jetpack requests are proxied to run as the
		// wpcom user) — revisit this comparison if it ever runs in another context.
		$requested = $request->get_param( 'email' );
		if ( is_string( $requested ) && '' !== trim( $requested ) ) {
			$requested = sanitize_email( $requested );

			if ( ! is_email( $requested ) ) {
				return new WP_Error( 'invalid_email', __( 'Please enter a valid email address.', 'jetpack' ), array( 'status' => 400 ) );
			}

			// Normalize both sides: comparing a sanitized address against the raw
			// stored email could route a genuine self-send through the guard.
			if ( 0 !== strcasecmp( $requested, sanitize_email( $self_email ) ) ) {
				$guard = ABSPATH . 'wp-content/mu-plugins/email-subscriptions/email-preview-guard.php';
				if ( ! class_exists( 'Email_Preview_Guard' ) && file_exists( $guard ) ) {
					require_once $guard;
				}

				if ( ! class_exists( 'Email_Preview_Guard' ) ) {
					return new WP_Error( 'send_email_preview_guard_unavailable', __( 'Test emails to another address are temporarily unavailable.', 'jetpack' ), array( 'status' => 503 ) );
				}

				// Email_Preview_Guard ships from wpcom and reaches the Phan stubs via the
				// separate stub-regeneration job, so it is not yet declared at analysis time.
				// @phan-suppress-next-line PhanUndeclaredClassMethod
				$guarded = Email_Preview_Guard::check( $requested );
				if ( is_wp_error( $guarded ) ) {
					return $guarded;
				}

				$email = $requested;
			}
		}

		// Try to create a new subscriber with the resolved email
		$subscriber = Blog_Subscriber::create( $email );
		if ( ! $subscriber ) {
			return new WP_Error( 'unverified', __( 'Could not create subscriber.', 'jetpack' ), array( 'status' => rest_authorization_required_code() ) );
		}

		// Send the post to the subscriber
		require_once ABSPATH . 'wp-content/mu-plugins/email-subscriptions/subscription-mailer.php';
		$mailer       = new Subscription_Mailer( $subscriber );
		$subscription = $subscriber->get_subscription( get_current_blog_id() );

		/**
		 * Fires immediately before an email preview is dispatched to the current user.
		 *
		 * Useful for inspecting the post content with an external classifier (e.g. an
		 * LLM-based content moderator) or for logging outbound previews. Fires after
		 * the subscriber has been resolved, so handlers receive a post that is about
		 * to be sent.
		 *
		 * @module subscriptions
		 *
		 * @since 15.8
		 *
		 * @param WP_Post                 $post         The post being previewed.
		 * @param Blog_Subscriber         $subscriber   The subscriber receiving the preview.
		 * @param Blog_Subscription|false $subscription The subscriber's subscription for the current blog, or false if none exists.
		 */
		do_action( 'jetpack_before_send_email_preview', $post, $subscriber, $subscription );

		$mailer->send_post( $post, $subscription );

		// Return a response
		return new WP_REST_Response( 'Email preview sent successfully.', 200 );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Send_Email_Preview' );
