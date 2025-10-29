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

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Jetpack Social Controller class.
 *
 * @phan-constructor-used-for-side-effects
 */
class Shares_Data_Controller extends Base_Controller {

	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		$this->base_api_path = 'wpcom';
		$this->version       = 'v2';

		$this->namespace = "{$this->base_api_path}/{$this->version}";
		$this->rest_base = 'publicize/shares-data';

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
		if ( Utils::is_wpcom() ) {
			global $publicize;

			return rest_ensure_response(
				$publicize->get_publicize_shares_info( get_current_blog_id() )
			);
		}

		$response = $this->proxy_request_to_wpcom_as_user(
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
		return $this->publicize_permissions_check();
	}

	/**
	 * Schema for the endpoint.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'jetpack-social-shares-data',
			'type'       => 'object',
			'properties' => array(
				'publicized_count'       => array(
					'description' => __( 'Number of shares already used.', 'jetpack-publicize-pkg' ),
					'type'        => 'integer',
				),
				'to_be_publicized_count' => array(
					'description' => __( 'Number of scheduled shares.', 'jetpack-publicize-pkg' ),
					'type'        => 'integer',
				),
				'shared_posts_count'     => array(
					'description' => __( 'Number of posts shared.', 'jetpack-publicize-pkg' ),
					'type'        => 'integer',
				),
				'is_share_limit_enabled' => array(
					'description' => __( 'Whether the share limit is enabled.', 'jetpack-publicize-pkg' ),
					'type'        => 'boolean',
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}
}
