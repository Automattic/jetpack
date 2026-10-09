<?php
/**
 * The Protect dashboard's Scan history tab.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect\Sections;

use Automattic\Jetpack\Protect\Dashboard;
use Automattic\Jetpack\Protect\Dashboard_Section;
use WP_Error;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Threats Scan has fixed or ignored, for sites with a Scan plan.
 *
 * @since $$next-version$$
 */
class History implements Dashboard_Section {

	/**
	 * The key the section's state is printed under.
	 *
	 * @return string
	 */
	public function get_key() {
		return 'history';
	}

	/**
	 * The section's state on page load.
	 *
	 * @return array
	 */
	public function get_state() {
		return array( 'hasPlan' => Dashboard::has_scan_plan() );
	}

	/**
	 * Register the section's REST routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/protect-dashboard/history',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_history' ),
				'permission_callback' => array( Dashboard::class, 'can_manage' ),
			)
		);
	}

	/**
	 * Threats Scan has fixed or ignored.
	 *
	 * @return array|WP_Error
	 */
	public static function get_history() {
		if ( ! Dashboard::has_scan_plan() ) {
			return new WP_Error( 'no_scan_plan', __( 'Scan history needs a Jetpack Scan plan.', 'jetpack-protect-pkg' ), array( 'status' => 403 ) );
		}

		return Scan::get_history_threats();
	}
}
