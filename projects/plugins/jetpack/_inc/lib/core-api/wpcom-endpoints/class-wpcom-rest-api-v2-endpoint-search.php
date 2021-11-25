<?php
/**
 * Proxy endpoint for Jetpack Search
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Search\REST_Controller;

/**
 * Jetpack Search: Makes authenticated requests to the site search API using blog tokens.
 * This endpoint will only be used when trying to search private Jetpack and WordPress.com sites.
 *
 * @since 9.0.0
 */
class WPCOM_REST_API_V2_Endpoint_Search extends WP_REST_Controller {
	/**
	 * Forward request to controller in Search package.
	 *
	 * @var REST_Controller
	 */
	protected $controller;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace  = 'wpcom/v2';
		$this->rest_base  = 'search';
		$this->controller = new REST_Controller( defined( 'IS_WPCOM' ) && IS_WPCOM );

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Called automatically on `rest_api_init()`.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this->controller, 'get_search_results' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Search' );
