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
				'id' => array(
					'description' => __( 'Unique identifier for the post.', 'jetpack' ),
					'type'        => 'integer',
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
	 * Build an Akismet payload describing the post content being previewed.
	 *
	 * Uses the post author as the identity signal (not the caller), because
	 * the author is what Akismet should evaluate the content against.
	 *
	 * @since 15.8
	 *
	 * @param WP_Post $post Post being previewed.
	 * @return array Associative payload suitable for http_build_query().
	 */
	protected function prepare_post_for_akismet( WP_Post $post ): array {
		$author = get_userdata( (int) $post->post_author );

		$payload = array(
			'comment_type'         => 'blog-post-preview',
			'comment_content'      => $post->post_title . "\n\n" . $post->post_content,
			'comment_author'       => $author ? $author->display_name : '',
			'comment_author_email' => $author ? $author->user_email : '',
			'comment_author_url'   => $author ? $author->user_url : '',
			'permalink'            => (string) get_permalink( $post ),
			'blog'                 => (string) get_option( 'home' ),
			'blog_lang'            => (string) get_bloginfo( 'language' ),
			'comment_date_gmt'     => gmdate( DATE_ATOM, time() ),
		);

		/**
		 * Filter the values sent to Akismet when checking an email preview.
		 *
		 * @module subscriptions
		 *
		 * @since 15.8
		 *
		 * @param array   $payload The values being sent to Akismet.
		 * @param WP_Post $post    The post being previewed.
		 */
		$filtered_payload = apply_filters( 'jetpack_send_email_preview_akismet_values', $payload, $post );

		return is_array( $filtered_payload ) ? $filtered_payload : $payload;
	}

	/**
	 * Whether the Akismet plugin is loaded and usable in this request.
	 *
	 * Extracted into a method so tests can override it via a subclass.
	 *
	 * @since 15.8
	 *
	 * @return bool
	 */
	protected function is_akismet_available(): bool {
		return function_exists( 'akismet_http_post' ) || ( class_exists( 'Akismet' ) && method_exists( 'Akismet', 'http_post' ) );
	}

	/**
	 * POST a comment-check payload to the Akismet service.
	 *
	 * Extracted into a method so tests can override it via a subclass.
	 *
	 * @since 15.8
	 *
	 * @param string $query_string URL-encoded payload.
	 * @return array Two-element array as returned by Akismet: [ headers_array, body_string ].
	 */
	protected function akismet_http_post( string $query_string ): array {
		if ( method_exists( 'Akismet', 'http_post' ) ) {
			return \Akismet::http_post( $query_string, 'comment-check' );
		}

		global $akismet_api_host, $akismet_api_port;
		return akismet_http_post( $query_string, $akismet_api_host, '/1.1/comment-check', $akismet_api_port );
	}

	/**
	 * Ask Akismet whether a post being previewed looks like spam.
	 *
	 * Fail-open: any ambiguity (Akismet absent, malformed response) returns false
	 * so the author's workflow isn't blocked on service hiccups.
	 *
	 * @since 15.8
	 *
	 * @param WP_Post $post Post being previewed.
	 * @return bool True when Akismet classifies the content as spam; false otherwise.
	 */
	protected function check_post_for_spam( WP_Post $post ): bool {
		if ( ! $this->is_akismet_available() ) {
			return false;
		}

		$form     = $this->prepare_post_for_akismet( $post );
		$response = $this->akismet_http_post( http_build_query( $form ) );

		if (
			isset( $response[0]['x-akismet-pro-tip'] ) &&
			'discard' === trim( $response[0]['x-akismet-pro-tip'] ) &&
			'1' === get_option( 'akismet_strictness' )
		) {
			return true;
		}

		return isset( $response[1] ) && 'true' === trim( $response[1] );
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

		if ( ! $post instanceof WP_Post ) {
			return new WP_Error(
				'rest_post_invalid_id',
				__( 'Invalid post ID.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		// Check if the user's email is verified
		if ( Email_Verification::is_email_unverified() ) {
			return new WP_Error( 'unverified', __( 'Your email address must be verified.', 'jetpack' ), array( 'status' => rest_authorization_required_code() ) );
		}

		if ( $this->check_post_for_spam( $post ) ) {
			return new WP_Error(
				'email_preview_not_sent',
				__( 'Email preview could not be sent.', 'jetpack' ),
				array( 'status' => 500 )
			);
		}

		$current_user = wp_get_current_user();
		$email        = $current_user->user_email;

		// Try to create a new subscriber with the user's email
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
		 * LLM-based content moderator) or for logging outbound previews. Fires only
		 * after the Akismet spam check has passed and the subscriber has been
		 * resolved, so handlers receive a post that is about to be sent.
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
