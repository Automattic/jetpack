<?php
/**
 * The Publicize services Controller class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Publicize\Publicize_Utils;
use Automattic\Jetpack\Publicize\Services;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Services Controller class.
 *
 * @phan-constructor-used-for-side-effects
 */
class Services_Controller extends Base_Controller {

	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		$this->base_api_path = 'wpcom';
		$this->version       = 'v2';

		$this->namespace = "{$this->base_api_path}/{$this->version}";
		$this->rest_base = 'publicize/services';

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
	 * Schema for the endpoint.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'jetpack-publicize-service',
			'type'       => 'object',
			'properties' => array(
				'id'          => array(
					'type'        => 'string',
					'description' => __( 'Alphanumeric slug for the service.', 'jetpack-publicize-pkg' ),
				),
				'description' => array(
					'type'        => 'string',
					'description' => __( 'Description for the service.', 'jetpack-publicize-pkg' ),
				),
				'label'       => array(
					'type'        => 'string',
					'description' => __( 'Human-readable label for the Jetpack Social service.', 'jetpack-publicize-pkg' ),
				),
				'status'      => array(
					'type'        => 'string',
					'description' => __( 'Status of the service.', 'jetpack-publicize-pkg' ),
					'enum'        => array( null, 'ok', 'unsupported' ),
				),
				'supports'    => array(
					'type'        => 'object',
					'description' => __( 'An object of features that the service supports.', 'jetpack-publicize-pkg' ),
					'properties'  => array(
						'additional_users'      => array(
							'type'        => 'boolean',
							'description' => __( 'Whether the service is supported for multiple additional user accounts.', 'jetpack-publicize-pkg' ),
						),
						'additional_users_only' => array(
							'type'        => 'boolean',
							'description' => __( 'Whether the service supports only the additional users and not the main user account.', 'jetpack-publicize-pkg' ),
						),
					),
				),
				'url'         => array(
					'type'        => 'string',
					'description' => __( 'URL to use for connecting an account for the service.', 'jetpack-publicize-pkg' ),
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Verify that the request has access to services list.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error
	 */
	public function get_items_permissions_check( $request ) {// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->publicize_permissions_check();
	}

	/**
	 * Get list of Publicize services.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response suitable for 1-page collection
	 */
	public function get_items( $request ) {
		if ( Publicize_Utils::is_wpcom() ) {

			$items = array();

			foreach ( Services::wpcom_get_all() as $item ) {
				$data = $this->prepare_item_for_response( $item, $request );

				$items[] = $this->prepare_response_for_collection( $data );
			}
		} else {
			$items = $this->proxy_request_to_wpcom_as_user( $request );

			if ( is_wp_error( $items ) ) {
				return $items;
			}
		}

		$response = rest_ensure_response( $items );
		$response->header( 'X-WP-Total', (string) count( $items ) );
		$response->header( 'X-WP-TotalPages', '1' );

		return $response;
	}
}
