<?php
/**
 * X Usage Controller.
 *
 * Exposes X share quota and per-month usage data for client UI.
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
	 * Get X usage data.
	 *
	 * Returns the quota limit, plan type, and usage breakdown.
	 * Each period with data includes counts of 'used' (done) and 'pending'
	 * (scheduled/future) shares. Only periods with entries are included.
	 *
	 * For paid plans, usage is keyed by yyyy-mm with per-month quota.
	 * For free plans, usage is keyed by 'free' with a lifetime limit.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( Utils::is_wpcom() ) {
			require_lib( 'publicize/util/x-usage' );

			$blog_id = get_current_blog_id();
			$usage   = \Publicize\get_x_usage( $blog_id );
			$is_free = \Publicize\is_free_x_plan( $blog_id );
			$limit   = \Publicize\get_x_share_limit( $blog_id );

			// Build per-month breakdown.
			$months = array();
			foreach ( $usage as $month => $entries ) {
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

				$months[ $month ] = array(
					'used'    => $used,
					'pending' => $pending,
					'total'   => $used + $pending,
				);
			}

			// Sort by month key.
			ksort( $months );

			$data = array(
				'limit'   => $limit,
				'is_free' => $is_free,
				'usage'   => $months,
			);

			return rest_ensure_response( $data );
		}

		return rest_ensure_response(
			$this->proxy_request_to_wpcom_as_user( $request )
		);
	}

	/**
	 * Schema for the endpoint.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'publicize-x-usage',
			'type'       => 'object',
			'properties' => array(
				'limit'   => array(
					'type'        => 'integer',
					'description' => __( 'Maximum number of X shares allowed (per month for paid, lifetime for free).', 'jetpack-publicize-pkg' ),
				),
				'is_free' => array(
					'type'        => 'boolean',
					'description' => __( 'Whether the site is on the free plan (lifetime limit vs monthly).', 'jetpack-publicize-pkg' ),
				),
				'usage'   => array(
					'type'                 => 'object',
					'description'          => __( 'Usage breakdown keyed by yyyy-mm for paid plans or "free" for free plans. Only periods with data are included.', 'jetpack-publicize-pkg' ),
					'additionalProperties' => array(
						'type'       => 'object',
						'properties' => array(
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
					),
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}
}
