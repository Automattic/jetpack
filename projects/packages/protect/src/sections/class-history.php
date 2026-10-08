<?php
/**
 * The Protect dashboard's Scan history tab.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect\Sections;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Protect\Dashboard;
use Automattic\Jetpack\Protect\Dashboard_Section;
use Automattic\Jetpack\Protect\Dashboard_Threats;
use Automattic\Jetpack\Protect_Models\Threat_Model;
use Jetpack_Options;
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
	 * Transient caching the Scan history.
	 *
	 * @var string
	 */
	const TRANSIENT = 'jetpack_protect_dashboard_scan_history';

	/**
	 * Clear the cached history whenever the dashboard starts a scan.
	 */
	public function __construct() {
		add_action( 'jetpack_protect_dashboard_scan_started', array( __CLASS__, 'clear_cache' ) );
	}

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
	 * Drop the cached history so a new scan's results show up.
	 *
	 * @return void
	 */
	public static function clear_cache() {
		delete_transient( self::TRANSIENT );
	}

	/**
	 * Threats Scan has fixed or ignored, cached for five minutes.
	 *
	 * @return array|WP_Error
	 */
	public static function get_history() {
		if ( ! Dashboard::has_scan_plan() ) {
			return new WP_Error( 'no_scan_plan', __( 'Scan history needs a Jetpack Scan plan.', 'jetpack-protect-pkg' ), array( 'status' => 403 ) );
		}

		$cached = get_transient( self::TRANSIENT );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/scan/history', Jetpack_Options::get_option( 'id' ) ),
			'2',
			array(),
			null,
			'wpcom'
		);
		$body     = json_decode( wp_remote_retrieve_body( $response ) );
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) || ! is_object( $body ) ) {
			return new WP_Error( 'history_unavailable', __( 'Scan history is unavailable right now.', 'jetpack-protect-pkg' ), array( 'status' => 502 ) );
		}

		$threats = array();
		foreach ( (array) ( $body->threats ?? array() ) as $threat ) {
			$threats[] = Dashboard_Threats::format( new Threat_Model( $threat ) );
		}

		set_transient( self::TRANSIENT, $threats, 5 * MINUTE_IN_SECONDS );
		return $threats;
	}
}
