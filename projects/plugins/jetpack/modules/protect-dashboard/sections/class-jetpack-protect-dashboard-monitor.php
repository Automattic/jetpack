<?php
/**
 * Protect dashboard: the Monitor section, for downtime monitoring.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * The Monitor module's state and its uptime history.
 *
 * @since $$next-version$$
 */
class Jetpack_Protect_Dashboard_Monitor implements Jetpack_Protect_Dashboard_Section {

	/**
	 * Days of uptime the section shows.
	 *
	 * @var int
	 */
	const UPTIME_DAYS = 40;

	/**
	 * Transient caching the uptime history.
	 *
	 * @var string
	 */
	const UPTIME_TRANSIENT = 'jetpack_protect_dashboard_uptime';

	/**
	 * The section's key.
	 *
	 * @return string
	 */
	public function get_key() {
		return 'monitor';
	}

	/**
	 * Whether the Monitor module can run here, and whether it is on.
	 *
	 * @return array
	 */
	public function get_state() {
		return Jetpack_Protect_Dashboard::get_module_state( 'monitor' );
	}

	/**
	 * Register the uptime route.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/protect-dashboard/uptime',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_uptime' ),
				'permission_callback' => array( 'Jetpack_Protect_Dashboard', 'can_manage' ),
			)
		);
	}

	/**
	 * Daily uptime for the last UPTIME_DAYS days, oldest first, from WordPress.com.
	 *
	 * @return array|WP_Error
	 */
	public function get_uptime() {
		$cached = get_transient( self::UPTIME_TRANSIENT );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		// The endpoint checks `manage_options` for the requesting user, so a blog token is refused.
		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return new WP_Error( 'not_connected', __( 'Connect your WordPress.com account to see uptime.', 'jetpack' ), array( 'status' => 403 ) );
		}

		// It has no 40-day period, so ask for 90 and keep the newest days.
		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/jetpack-monitor-uptime?period=%s', Jetpack_Options::get_option( 'id' ), rawurlencode( '90 days' ) ),
			'2',
			array(),
			null,
			'wpcom'
		);
		$code     = wp_remote_retrieve_response_code( $response );
		$body     = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( is_wp_error( $response ) || 200 !== $code || ! is_array( $body ) ) {
			return new WP_Error( 'uptime_unavailable', __( 'Uptime history is unavailable right now.', 'jetpack' ), array( 'status' => 502 ) );
		}

		ksort( $body );
		$days = array();
		foreach ( array_slice( $body, -self::UPTIME_DAYS, null, true ) as $date => $day ) {
			$days[] = array(
				'date'              => (string) $date,
				'status'            => (string) ( $day['status'] ?? 'monitor_inactive' ),
				'downtimeInMinutes' => (int) ( $day['downtime_in_minutes'] ?? 0 ),
			);
		}

		set_transient( self::UPTIME_TRANSIENT, $days, 10 * MINUTE_IN_SECONDS );
		return $days;
	}
}

Jetpack_Protect_Dashboard::register_section( new Jetpack_Protect_Dashboard_Monitor() );
