<?php
/**
 * Publicize: Share post
 *
 * Share the post.
 *
 * @package automattic/jetpack
 * @since 6.8
 */

use Automattic\Jetpack\Connection\Client;

require_once __DIR__ . '/publicize-connections.php';

/**
 * Publicize Share post class.
 */
class WPCOM_REST_API_V2_Endpoint_List_Publicize_Share_Post extends WPCOM_REST_API_V2_Endpoint_List_Publicize_Connections {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'publicize/share';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Called automatically on `rest_api_init()`.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<postId>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'share_post' ),
					'permission_callback' => array( $this, 'get_items_permission_check' ),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);
	}

	/**
	 * Adds the test results properties to the Connection schema.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title'   => 'jetpack-publicize-share-post',
			'type'    => 'object',
		);

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Share the post hitting the publicize wpcom endpoint.
	 *
	 * @param  WP_REST_Request $request The request.
	 * @return WP_REST_Response          share post response
	 */
	public function share_post( $request ) {
		$post_id             = $request->get_param( 'postId' );
		$skipped_connections = $request->get_param( 'skippedConnections' );
		$message             = $request->get_param( 'message' );

		/*
		 * Publicize endpoint
		 * [POST] wpcom/v2/sites/<site-id>/posts/<post-id>/publicize
		 * body:
		 *   - message: string
		 *   - skipped_connections: array of connection ids to skip
		 */
		$url = sprintf(
			'/sites/%d/posts/%d/publicize',
			Jetpack_Options::get_option( 'id' ),
			$post_id
		);

		$response = Client::wpcom_json_api_request_as_user(
			$url,
			'v2',
			array(
				'method'  => 'POST',
				'headers' => array(
					'Content-Type'    => 'application/json',
					'X-Forwarded-For' => Jetpack::current_user_ip( true ),
				),
			),
			array(
				'message'             => $message,
				'skipped_connections' => $skipped_connections,
			)
		);

		if ( is_wp_error( $response ) ) {
			return rest_ensure_response( $response );
		}

		return json_decode( wp_remote_retrieve_body( $response ), true );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_List_Publicize_Share_Post' );
