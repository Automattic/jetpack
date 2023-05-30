<?php
/**
 * REST API endpoint for managing Stats options.
 *
 * @package automattic/jetpack-stats-admin
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats\Options;
use WP_REST_Server;

/**
 * VideoPress wpcom api v2 endpoint
 */
class WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings extends Base_Stats_Rest_Controller {
	const DASHBOARD_SETTINGS = 'module_settings';
	const DASHBOARD_MODULES  = 'modules';

	const ALLOWED_MODULES = array(
		'traffic'     => array( 'highlights', 'chart', 'posts-pages', 'referrers', 'countries', 'authors', 'search-terms', 'clicks', 'videos', 'app-promo' ),
		'insights'    => array( 'year-in-review', 'all-time-highlights', 'latest-post', 'most-popular-post', 'posting-activities', 'all-time-insights', 'tags-categories', 'comments', 'subscribers', 'number-of-subscribers' ),
		'subscribers' => array( 'all-time-stats', 'chart', 'subscribers-overview', 'subscribers', 'number-of-subscribers' ),
		'wordads'     => array( 'totals', 'chart', 'earning-history', 'app-promo' ),
		'store'       => array( 'chart', 'store-stats-table-1', 'store-stats-table-2', 'most-popular-products', 'top-categories', 'most-used-coupons' ),
	);

	/**
	 * The namespace of this controller's route.
	 *
	 * @var string
	 */
	public $namespace = 'wpcom/v2';
	/**
	 * The base of this controller's route.
	 *
	 * @var string
	 */
	public $rest_base = 'stats-admin';

	/**
	 * Register the route.
	 */
	public function register_rest_routes() {
		// Set modules Route.
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/modules',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_modules_status' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Set modules Route.
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/modules',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_modules_status' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);
	}

	/**
	 * Update modules.
	 *
	 * @param WP_REST_Request $req Request.
	 * @return mixed
	 */
	public function update_modules_status( $req ) {
		$current_modules = Options::get_option( self::DASHBOARD_MODULES );
		$changed         = false;
		foreach ( $req->get_params() as $page => $page_modules ) {
			// Only allow existing pages.
			if ( ! isset( self::ALLOWED_MODULES[ $page ] ) ) {
				continue;
			}

			// Filter only the allowed moudules.
			$page_modules = array_filter(
				$page_modules,
				function ( $module ) use ( $page ) {
					return in_array( $module, self::ALLOWED_MODULES[ $page ], true );
				}
			);

			// Module values should be boolean.
			$page_modules = array_map( 'boolval', $page_modules );

			if ( isset( $current_modules[ $page ] ) ) {
				$current_modules[ $page ] = array_merge( $current_modules[ $page ], $page_modules );
			} else {
				$current_modules[ $page ] = $page_modules;
			}

			$changed = true;
		}

		return array( 'updated' => $changed && Options::set_option( self::DASHBOARD_MODULES, $current_modules ) );
	}

	/**
	 * Get dashboard settings.
	 *
	 * @return mixed
	 */
	public function get_modules_status() {
		return Options::get_option( self::DASHBOARD_MODULES );
	}
}
