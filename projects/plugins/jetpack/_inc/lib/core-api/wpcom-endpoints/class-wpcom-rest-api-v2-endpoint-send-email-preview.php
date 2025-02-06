<?php
/**
 * Handles the sending of email previews via the WordPress.com REST API.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Status\Host;

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
		$mailer->send_post( $post, $subscription );

		// Return a response
		return new WP_REST_Response( 'Email preview sent successfully.', 200 );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Send_Email_Preview' );
