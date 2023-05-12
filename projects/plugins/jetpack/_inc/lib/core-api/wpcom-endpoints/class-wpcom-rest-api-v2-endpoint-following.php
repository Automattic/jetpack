<?php
/**
 * REST API endpoint for the Jetpack author recommendations block.
 *
 * @package automattic/jetpack
 * @since 11.8
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status\Visitor;

/**
 * Class WPCOM_REST_API_V2_Endpoint_AI
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
	 * WPCOM_REST_API_V2_Endpoint_AI constructor.
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
					'permission_callback' => 'is_user_logged_in',
				),
				'args' => array(
					'remove_user_blogs' => array(
						'type'    => 'boolean',
						'default' => false,
					),
				),
			)
		);
	}

	/**
	 * Gets the sites the user is following
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 */
	public function get_response( $request ) {
		$remove_user_blogs = $request->get_param( 'remove_user_blogs' );

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			require_once WP_CONTENT_DIR . '/lib/wpcom-user-following.php';
			return get_user_followed_blogs( get_current_user_id(), $remove_user_blogs );
		}

		$body = Client::wpcom_json_api_request_as_user(
			'/me/following?remove_user_blogs=' . (int) $remove_user_blogs,
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

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return $response;
	}

}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Following' );
