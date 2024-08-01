<?php
/**
 * Email Preview endpoint for the WordPress.com REST API.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Status\Host;

require_once __DIR__ . '/trait-wpcom-rest-api-proxy-request-trait.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Email_Preview
 *
 * Returns an email preview given a post id.
 */
class WPCOM_REST_API_V2_Endpoint_Email_Preview extends WP_REST_Controller {

	use WPCOM_REST_API_Proxy_Request_Trait;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->base_api_path                   = 'wpcom';
		$this->version                         = 'v2';
		$this->namespace                       = $this->base_api_path . '/' . $this->version;
		$this->rest_base                       = '/email-preview';
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = true;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Registers the routes for email preview.
	 *
	 * @see register_rest_route()
	 */
	public function register_routes() {
		$options = array(
			'show_in_index'       => true,
			'methods'             => 'GET',
			// if this is not a wpcom site, we need to proxy the request to wpcom
			'callback'            => ( ( new Host() )->is_wpcom_simple() ) ? array(
				$this,
				'email_preview',
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
				l( 'not connected!' );
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
	 * Returns an email preview of a post.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function email_preview( $request ) {
		$post_id = $request['post_id'];
		$post    = get_post( $post_id );

		// Return error if the post cannot be retrieved
		if ( is_wp_error( $post ) ) {
			return new WP_Error( 'post_not_found', 'Post not found', array( 'status' => 404 ) );
		}

		if ( ! defined( 'IS_HTML_EMAIL' ) ) {
			define( 'IS_HTML_EMAIL', true );
		}
		A8C\Block_Rendering\load();

		$subscriber = new Blog_Subscriber( 'foo@example.com' );
		$mailer     = new Subscription_Mailer( $subscriber, true );

		$mailer_html = $mailer->get_posts( array( $post ) )['html'][0];

		if ( empty( $mailer_html ) ) {
			return new WP_Error( 'empty_preview', 'Preview generation failed', array( 'status' => 500 ) );
		}

		$allowed_html    = wp_kses_allowed_html( 'post' );
		$additional_tags = array(
			'html'  => array(),
			'head'  => array(),
			'meta'  => array(
				'name'       => true,
				'content'    => true,
				'http-equiv' => true,
				'charset'    => true,
			),
			'style' => array(
				'type' => true,
			),
			'body'  => array(),
		);
		$allowed_html    = array_merge( $allowed_html, $additional_tags );

		$mailer_html = wp_kses( $mailer_html, $allowed_html );

		return rest_ensure_response(
			array(
				'html' => $mailer_html,
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Email_Preview' );
