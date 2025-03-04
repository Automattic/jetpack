<?php
/**
 * The Jetpack Social Controller class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Publicize\Publicize_Utils as Utils;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Jetpack Social Controller class.
 */
class Jetpack_Social_Controller extends Base_Controller {

	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		$this->base_api_path = 'wpcom';
		$this->version       = 'v2';

		$this->namespace = "{$this->base_api_path}/{$this->version}";
		$this->rest_base = 'jetpack-social';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Get Jetpack Social data.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_items( $request ) {
		$response = $this->proxy_request_to_wpcom_as_blog(
			$request
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		set_transient( 'jetpack_publicize_shares_info', $response, 1 * MONTH_IN_SECONDS );

		return rest_ensure_response( $response );
	}

	/**
	 * Verify that the request has access to Jetpack Social data.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error
	 */
	public function get_items_permissions_check( $request ) {// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// We only support this endpoint for self-hosted sites.
		if ( Utils::is_wpcom() ) {
			return new WP_Error( 'invalid_request', 'This endpoint is not available for WordPress.com sites.', array( 'status' => 404 ) );
		}

		return $this->publicize_permissions_check();
	}
}
