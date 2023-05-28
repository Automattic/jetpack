<?php
/**
 * Send Email Preview endpoint.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;

/**
 * Class WPCOM_REST_API_V2_Send_Email_Preview
 */
class WPCOM_REST_API_V2_Send_Email_Preview extends WP_REST_Posts_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->post_type                       = 'post';
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
			'callback'            => array( $this, 'send_email_preview' ),
			'permission_callback' => array( $this, 'permissions_check' ),
			'args'                => array(
				'id' => array(
					'description' => __( 'Unique identifier for the post.', 'jetpack' ),
					'type'        => 'integer',
				),
			),
		);

		// if this is not a wpcom site, we need to proxy the request to wpcom
		if ( ! ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ) {
			$options['callback']            = array( $this, 'proxy_request_to_wpcom' );
			$options['permission_callback'] = array( ( new Manager() ), 'is_user_connected' );
		}

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			$options
		);
	}

	/**
	 * Checks if a given request has access to edit the post for a site.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return true|WP_Error True if the request has edit access, WP_Error object otherwise.
	 */
	public function permissions_check( $request ) {
		$request['context'] = 'edit';

		return $this->get_item_permissions_check( $request );
	}

	/**
	 * Sends an email preview of a post to the current user.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function send_email_preview( $request ) {
		$post_id = $request['id'];
		$post    = $this->get_post( $post_id );

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

	/**
	 * Proxy request to wpcom servers for the site and user.
	 *
	 * @param WP_Rest_Request $request Request to proxy.
	 * @param string          $path Path to append to the rest base.
	 *
	 * @return mixed|WP_Error           Response from wpcom servers or an error.
	 */
	public function proxy_request_to_wpcom( $request, $path = '' ) {
		$blog_id = \Jetpack_Options::get_option( 'id' );
		$path    = '/sites/' . rawurldecode( $blog_id ) . rawurldecode( $this->rest_base ) . ( $path ? '/' . rawurldecode( $path ) : '' );
		$api_url = add_query_arg( $request->get_query_params(), $path );

		// Prefer request as user, if possible. Fall back to blog request to show prompt data for unconnected users.
		$response = ( ( new Manager() )->is_user_connected() )
			? Client::wpcom_json_api_request_as_user( $api_url, $this->version, array( 'method' => $request->get_method() ), $request->get_body(), $this->base_api_path )
			: Client::wpcom_json_api_request_as_blog( $api_url, $this->version, array( 'method' => $request->get_method() ), $request->get_body(), $this->base_api_path );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_status = wp_remote_retrieve_response_code( $response );
		$response_body   = json_decode( wp_remote_retrieve_body( $response ) );

		if ( $response_status >= 400 ) {
			$code    = isset( $response_body->code ) ? $response_body->code : 'unknown_error';
			$message = isset( $response_body->message ) ? $response_body->message : __( 'An unknown error occurred.', 'jetpack' );

			return new WP_Error( $code, $message, array( 'status' => $response_status ) );
		}

		return $response_body;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Send_Email_Preview' );
