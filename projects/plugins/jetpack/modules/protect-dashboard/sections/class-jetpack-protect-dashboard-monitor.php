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
	 * Whether the Monitor module can run here, whether it is on, and how many days of uptime show.
	 *
	 * @return array
	 */
	public function get_state() {
		return array_merge(
			Jetpack_Protect_Dashboard::get_module_state( 'monitor' ),
			array( 'uptimeDays' => self::UPTIME_DAYS )
		);
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
	 * Daily uptime for the last UPTIME_DAYS days (oldest first) and the current status, from WordPress.com.
	 *
	 * @return array|WP_Error
	 */
	public function get_uptime() {
		// The endpoints check `manage_options` for the requesting user, so a blog token is refused.
		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return new WP_Error( 'not_connected', __( 'Connect your WordPress.com account to see uptime.', 'jetpack' ), array( 'status' => 403 ) );
		}

		$cached = get_transient( self::UPTIME_TRANSIENT );
		if ( is_array( $cached ) ) {
			return $cached;
		}
		if ( 'failed' === $cached ) {
			return $this->unavailable_error();
		}

		$days = $this->fetch_days();
		if ( ! $days ) {
			set_transient( self::UPTIME_TRANSIENT, 'failed', MINUTE_IN_SECONDS );
			return $this->unavailable_error();
		}

		$uptime = array(
			'days' => $days,
			'isUp' => $this->fetch_is_up(),
		);
		set_transient( self::UPTIME_TRANSIENT, $uptime, null === $uptime['isUp'] ? MINUTE_IN_SECONDS : 10 * MINUTE_IN_SECONDS );
		return $uptime;
	}

	/**
	 * The newest UPTIME_DAYS days of uptime, oldest first; empty when unavailable.
	 *
	 * @return array
	 */
	private function fetch_days() {
		// It has no 40-day period, so ask for 90 and keep the newest days.
		$body = $this->request( '/jetpack-monitor-uptime?period=' . rawurlencode( '90 days' ) );
		if ( ! is_array( $body ) ) {
			return array();
		}

		$body = array_filter(
			$body,
			function ( $day, $date ) {
				return is_array( $day ) && preg_match( '/^\d{4}-\d{2}-\d{2}$/', (string) $date );
			},
			ARRAY_FILTER_USE_BOTH
		);
		ksort( $body );

		$days = array();
		foreach ( array_slice( $body, -self::UPTIME_DAYS, null, true ) as $date => $day ) {
			$status = $day['status'] ?? null;
			$days[] = array(
				'date'              => (string) $date,
				'status'            => in_array( $status, array( 'up', 'down' ), true ) ? $status : 'monitor_inactive',
				'downtimeInMinutes' => (int) ( $day['downtime_in_minutes'] ?? 0 ),
			);
		}
		return $days;
	}

	/**
	 * Whether the site is up right now; null when unknown.
	 *
	 * @return bool|null
	 */
	private function fetch_is_up() {
		$body   = $this->request( '/jetpack-monitor-status' );
		$status = is_array( $body ) ? ( $body['status'] ?? null ) : null;
		return is_bool( $status ) ? $status : null;
	}

	/**
	 * GET a wpcom/v2 site endpoint as the current user.
	 *
	 * @param string $path Path after `/sites/<id>`.
	 * @return mixed The decoded body, or null on failure.
	 */
	private function request( $path ) {
		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d', Jetpack_Options::get_option( 'id' ) ) . $path,
			'2',
			array(),
			null,
			'wpcom'
		);
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}
		return json_decode( wp_remote_retrieve_body( $response ), true );
	}

	/**
	 * The error returned when WordPress.com can't be reached.
	 *
	 * @return WP_Error
	 */
	private function unavailable_error() {
		return new WP_Error( 'uptime_unavailable', __( 'Uptime history is unavailable right now.', 'jetpack' ), array( 'status' => 502 ) );
	}
}

Jetpack_Protect_Dashboard::register_section( new Jetpack_Protect_Dashboard_Monitor() );
