<?php
/**
 * X Usage Controller.
 *
 * Exposes X share usage data as a collection.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Publicize\Publicize_Utils as Utils;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * X Usage Controller class.
 *
 * @phan-constructor-used-for-side-effects
 */
class X_Usage_Controller extends Base_Controller {

	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		$this->base_api_path = 'wpcom';
		$this->version       = 'v2';

		$this->namespace = "{$this->base_api_path}/{$this->version}";
		$this->rest_base = 'publicize/x-usage';

		$this->allow_requests_as_blog = true;

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
	 * Check permissions.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|\WP_Error
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->publicize_permissions_check();
	}

	/**
	 * Get X usage data as a collection.
	 *
	 * Returns an array of usage items, one per period. For paid plans,
	 * each item represents a calendar month (id = yyyy-mm). For free
	 * plans, a single item with id = 'free' covers lifetime usage.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( Utils::is_wpcom() ) {
			require_lib( 'publicize/util/x-usage' );

			$usage = \Publicize\get_x_usage( get_current_blog_id() );

			$items = array();
			foreach ( $usage as $period => $entries ) {
				if ( ! is_array( $entries ) || empty( $entries ) ) {
					continue;
				}

				$used    = 0;
				$pending = 0;
				foreach ( $entries as $entry ) {
					if ( 'done' === ( $entry['status'] ?? '' ) ) {
						++$used;
					} else {
						++$pending;
					}
				}

				$item = array(
					'period'  => $period,
					'used'    => $used,
					'pending' => $pending,
					'total'   => $used + $pending,
				);

				$data    = $this->prepare_item_for_response( $item, $request );
				$items[] = $this->prepare_response_for_collection( $data );
			}

			$response = rest_ensure_response( $items );
			$response->header( 'X-WP-Total', (string) count( $items ) );
			$response->header( 'X-WP-TotalPages', '1' );

			return $response;
		}

		return rest_ensure_response(
			$this->proxy_request_to_wpcom_as_blog( $request )
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
			'title'      => 'publicize-x-usage',
			'type'       => 'object',
			'properties' => array(
				'period'  => array(
					'type'        => 'string',
					'description' => __( 'Period identifier: yyyy-mm for paid plans, "free" for free plans.', 'jetpack-publicize-pkg' ),
				),
				'used'    => array(
					'type'        => 'integer',
					'description' => __( 'Number of shares successfully sent.', 'jetpack-publicize-pkg' ),
				),
				'pending' => array(
					'type'        => 'integer',
					'description' => __( 'Number of shares scheduled or awaiting publish.', 'jetpack-publicize-pkg' ),
				),
				'total'   => array(
					'type'        => 'integer',
					'description' => __( 'Total shares counting toward quota (used + pending).', 'jetpack-publicize-pkg' ),
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $schema );
	}
}
