<?php
/**
 * REST controller for the dashboard notices, which need local processing the data proxy can't do.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use Automattic\Jetpack\PremiumAnalytics\Notices;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Exposes `jetpack-premium-analytics/v1/notices` (GET + POST).
 *
 * Unlike the transparent endpoints served by {@see Api_Proxy_Controller}, the notices GET augments
 * the WPCOM dismissal state with locally-derived flags (opt-in/opt-out/feedback/GDPR), so it lives
 * on its own route outside `proxy/` and delegates to the {@see Notices} class.
 */
class Notices_Controller {

	/**
	 * Package slug, used as the REST namespace root.
	 *
	 * @var string
	 */
	private const SLUG = 'jetpack-premium-analytics';

	/**
	 * REST namespace.
	 *
	 * @var string
	 */
	private $namespace;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = self::SLUG . '/v1';
	}

	/**
	 * Hook the controller's routes onto rest_api_init.
	 *
	 * @return void
	 */
	public static function register(): void {
		$controller = new self();
		add_action( 'rest_api_init', array( $controller, 'register_routes' ) );
	}

	/**
	 * Register the notices route.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/notices',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_notices' ),
					'permission_callback' => array( $this, 'check_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_notice' ),
					'permission_callback' => array( $this, 'check_permission' ),
					'args'                => array(
						'id'            => array(
							'required'    => true,
							'type'        => 'string',
							'description' => __( 'ID of the notice.', 'jetpack-premium-analytics' ),
						),
						'status'        => array(
							'required'    => true,
							'type'        => 'string',
							'description' => __( 'Status of the notice.', 'jetpack-premium-analytics' ),
						),
						'postponed_for' => array(
							'type'        => 'number',
							'default'     => 0,
							'description' => __( 'Postponed for (in seconds).', 'jetpack-premium-analytics' ),
							'minimum'     => 0,
						),
					),
				),
			)
		);
	}

	/**
	 * Whether the current user may read or change the dashboard notices.
	 *
	 * @return bool
	 */
	public function check_permission(): bool {
		return current_user_can( 'manage_options' ) || current_user_can( 'view_stats' );
	}

	/**
	 * Get the notices to show, with locally-derived flags merged in.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return array
	 */
	public function get_notices( WP_REST_Request $request ): array {
		return ( new Notices() )->get_notices_to_show( null !== $request->get_param( 'force_refresh' ) );
	}

	/**
	 * Dismiss or delay a notice.
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return array|\WP_Error
	 */
	public function update_notice( WP_REST_Request $request ) {
		return ( new Notices() )->update_notice(
			$request->get_param( 'id' ),
			$request->get_param( 'status' ),
			$request->get_param( 'postponed_for' )
		);
	}
}
