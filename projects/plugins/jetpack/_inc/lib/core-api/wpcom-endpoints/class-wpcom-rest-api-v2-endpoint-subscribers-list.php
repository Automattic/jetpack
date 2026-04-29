<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Subscribers List REST endpoint.
 *
 * Proxies the WP.com `/wpcom/v2/sites/{blog_id}/subscribers` endpoint so the
 * Subscribers Dashboard wp-admin page can render a live DataViews table on
 * Jetpack-connected self-hosted sites.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_Subscribers_List
 */
class WPCOM_REST_API_V2_Endpoint_Subscribers_List extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'subscribers/list';

		// On WPCOM the matching endpoint is registered via the wpcom-rest-api-v2 plugin loader,
		// where it talks to subscriber storage directly.
		$this->wpcom_is_wpcom_only_endpoint = true;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_subscribers' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'page'           => array(
							'type'    => 'integer',
							'default' => 1,
							'minimum' => 1,
						),
						'per_page'       => array(
							'type'    => 'integer',
							'default' => 10,
							'minimum' => 1,
							'maximum' => 100,
						),
						'sort'           => array(
							'type'    => 'string',
							'default' => 'date_subscribed',
							'enum'    => array( 'date_subscribed', 'name', 'plan', 'subscription_status' ),
						),
						'sort_order'     => array(
							'type'    => 'string',
							'default' => 'desc',
							'enum'    => array( 'asc', 'desc' ),
						),
						'search'         => array(
							'type'    => 'string',
							'default' => '',
						),
						'filters'        => array(
							'type'    => 'array',
							'items'   => array( 'type' => 'string' ),
							'default' => array( 'all' ),
						),
						'use_new_helper' => array(
							'type'    => 'boolean',
							'default' => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Permission check — manage_options matches the wp-admin Subscribers menu cap.
	 *
	 * @return true|WP_Error
	 */
	public function permission_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'authorization_required',
				__( 'You are not allowed to view subscribers for this site.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Proxy GET /wpcom/v2/sites/{blog_id}/subscribers.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_subscribers( $request ) {
		$blog_id = Connection_Manager::get_site_id();

		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$query = array(
			'page'           => (int) $request->get_param( 'page' ),
			'per_page'       => (int) $request->get_param( 'per_page' ),
			'sort'           => (string) $request->get_param( 'sort' ),
			'sort_order'     => (string) $request->get_param( 'sort_order' ),
			'use_new_helper' => $request->get_param( 'use_new_helper' ) ? 'true' : 'false',
		);

		$search = (string) $request->get_param( 'search' );
		if ( '' !== $search ) {
			$query['search'] = $search;
		}

		$query_string = http_build_query( $query );

		$filters = (array) $request->get_param( 'filters' );
		foreach ( $filters as $filter ) {
			$query_string .= '&' . rawurlencode( 'filters[]' ) . '=' . rawurlencode( (string) $filter );
		}

		$path = sprintf( '/sites/%d/subscribers?%s', (int) $blog_id, $query_string );

		$response = Client::wpcom_json_api_request_as_user(
			$path,
			'2',
			array( 'method' => 'GET' ),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status >= 400 ) {
			return new WP_Error(
				'subscribers_list_failed',
				is_array( $body ) && isset( $body['message'] ) ? $body['message'] : __( 'Could not fetch subscribers.', 'jetpack' ),
				array( 'status' => $status )
			);
		}

		return rest_ensure_response( $body );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Subscribers_List' );
