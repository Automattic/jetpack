<?php
/**
 * REST API endpoint for the Jetpack Blogroll block.
 *
 * @package automattic/jetpack
 * @since 12.2
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status\Visitor;

/**
 * Class WPCOM_REST_API_V2_Endpoint_Following
 */
class WPCOM_REST_API_V2_Endpoint_Following extends WP_REST_Controller {
	/**
	 * Namespace prefix.
	 *
	 * @var string
	 */
	public $namespace = 'wpcom/v2';

	/**
	 * Endpoint base route.
	 *
	 * @var string
	 */
	public $rest_base = 'following';

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = false;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/mine',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_response' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'ignore_user_blogs' => array(
							'type' => 'boolean',
						),
					),
				),
			)
		);
	}

	/**
	 * Check if user has edit post permission.
	 *
	 * @return true|WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function permission_check() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Gets the sites the user is following
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return array|WP_Error list of followed sites, WP_Error otherwise
	 */
	public function get_response( $request ) {
		$ignore_user_blogs = $request->get_param( 'ignore_user_blogs' );

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			require_once WP_CONTENT_DIR . '/lib/wpcom-get-user-followed-blogs.php';
			return get_user_followed_blogs( get_current_user_id(), $ignore_user_blogs );
		}

		$body = Client::wpcom_json_api_request_as_user(
			sprintf( '/me/following%s', $ignore_user_blogs ? '?ignore_user_blogs=true' : '' ),
			'2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'Content-Type'    => 'application/json',
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			)
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		return json_decode( wp_remote_retrieve_body( $body ) );
	}

}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Following' );
