<?php
/**
 * Validate whether a google doc is available for embedding.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\GoogleDocsEmbed;

/**
 * Google Docs block endpoint.
 */
class WPCOM_REST_API_V2_Endpoint_Google_Docs extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register endpoint route.
	 */
	public function register_routes() {
		register_rest_route(
			'wpcom/v2',
			'/checkGoogleDocVisibility',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'check_document_visibility' ),
					'permission_callback' => function () {
						return current_user_can( 'edit_posts' );
					},
				),
			)
		);
	}

	/**
	 * Check URL
	 *
	 * @param \WP_REST_Request $request request object.
	 *
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function check_document_visibility( $request ) {

		$document_url       = $request->get_param( 'url' );
		$document_url       = GoogleDocsEmbed\map_gsuite_url( $document_url );
		$response_head      = wp_safe_remote_head( $document_url );
		$is_public_document = ! is_wp_error( $response_head ) && ! empty( $response_head['response']['code'] ) && 200 === absint( $response_head['response']['code'] );

		if ( ! $is_public_document ) {
			return new \WP_Error( 'Unauthorized', esc_html__( 'The document is not publicly accessible', 'jetpack' ), array( 'status' => 401 ) );
		}

		return new \WP_REST_Response( '', 200 );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Google_Docs' );
